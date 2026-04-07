import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { ApplicationErrorCode } from '../src/common/error/coded-application.error';
import { configureApp } from '../src/configure-app';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { MailService } from '../src/mail/mail.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '../src/user/entity/user-role.enum';
import { UserModule } from '../src/user/user.module';
import { FactoryModule } from './factory/factory.module';
import { UserFactoryService } from './factory/user-factory.service';
import { TestGraphqlModule } from './graphql/test-graphql.module';
import { TestConfigModule } from './test-config.module';

const STRONG_PASSWORD = 'Test-12345!';

const CREATE_USER = `
  mutation CreateUser($dto: CreateUserInDto!) {
    createUser(dto: $dto) {
      id
      name
      email
      role
      isBanned
      isEmailVerified
    }
  }
`;

const UPDATE_USER = `
  mutation UpdateUser($id: Int!, $dto: UpdateUserInDto!) {
    updateUser(id: $id, dto: $dto) {
      id
      name
      email
      role
      isBanned
      isEmailVerified
    }
  }
`;

const DELETE_USER = `
  mutation DeleteUser($id: Int!) {
    deleteUser(id: $id)
  }
`;

const BAN_USER = `
  mutation BanUser($id: Int!) {
    banUser(id: $id) {
      id
      isBanned
    }
  }
`;

const UNBAN_USER = `
  mutation UnbanUser($id: Int!) {
    unbanUser(id: $id) {
      id
      isBanned
    }
  }
`;

function gqlRequest(app: NestApplication, query: string, variables: object, token?: string) {
  const req = request(app.getHttpServer())
    .post('/graphql')
    .send({ query, variables })
    .set('Content-Type', 'application/json');

  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }

  return req;
}

function expectSuccess(response: any) {
  expect(response.status).toBe(200);
  expect(response.body?.errors).toBeUndefined();
  expect(response.body?.data).toBeDefined();
}

function expectError(response: any, { code, status }: { code: string; status: string }) {
  expect(response.status).toBe(200);
  expect(response.body?.errors).toBeDefined();
  expect(response.body?.errors?.[0]?.code).toBe(code);
  expect(response.body?.errors?.[0]?.status).toBe(status);
}

describe('User Mutations E2E', () => {
  let moduleRef: TestingModule;
  let app: NestApplication;
  let authService: AuthService;
  let userFactory: UserFactoryService;
  let prisma: PrismaService;
  let mockMailService: { sendConfirmEmail: jest.Mock };

  beforeAll(async () => {
    mockMailService = { sendConfirmEmail: jest.fn().mockResolvedValue(undefined) };

    moduleRef = await Test.createTestingModule({
      imports: [TestConfigModule, TestGraphqlModule, FactoryModule, UserModule, GraphqlModule],
    })
      .overrideProvider(MailService)
      .useValue(mockMailService)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    authService = moduleRef.get(AuthService);
    userFactory = moduleRef.get(UserFactoryService);
    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockMailService.sendConfirmEmail.mockClear();
  });

  describe('createUser', () => {
    it('should return user with all expected fields', async () => {
      // Assume
      const dto = {
        name: userFactory.generateName(),
        email: userFactory.generateEmail(),
        password: STRONG_PASSWORD,
      };

      // Act
      const response = await gqlRequest(app, CREATE_USER, { dto });

      // Assert
      expectSuccess(response);

      const user = response.body.data.createUser;
      expect(user.id).toEqual(expect.any(Number));
      expect(user.name).toBe(dto.name);
      expect(user.email).toBe(dto.email.toLowerCase());
      expect(user.role).toBe(UserRole.USER);
      expect(user.isBanned).toBe(false);
      expect(user.isEmailVerified).toBe(false);
    });

    it('should store email in lowercase', async () => {
      // Assume
      const dto = {
        name: userFactory.generateName(),
        email: `UPPER-${userFactory.generateEmail()}`,
        password: STRONG_PASSWORD,
      };

      // Act
      const response = await gqlRequest(app, CREATE_USER, { dto });

      // Assert
      expectSuccess(response);
      expect(response.body.data.createUser.email).toBe(dto.email.toLowerCase());
    });

    it('should call sendConfirmEmail once after registration', async () => {
      // Assume
      const dto = {
        name: userFactory.generateName(),
        email: userFactory.generateEmail(),
        password: STRONG_PASSWORD,
      };

      // Act
      await gqlRequest(app, CREATE_USER, { dto });

      // Assert
      expect(mockMailService.sendConfirmEmail).toHaveBeenCalledTimes(1);
    });

    it('should fail with validation error when name is empty', async () => {
      // Assume
      const dto = { name: '', email: userFactory.generateEmail(), password: STRONG_PASSWORD };

      // Act
      const response = await gqlRequest(app, CREATE_USER, { dto });

      // Assert
      expectError(response, { code: ApplicationErrorCode.VALIDATION, status: 'BAD_REQUEST' });
    });

    it('should fail with validation error when email is invalid', async () => {
      // Assume
      const dto = { name: userFactory.generateName(), email: 'not-an-email', password: STRONG_PASSWORD };

      // Act
      const response = await gqlRequest(app, CREATE_USER, { dto });

      // Assert
      expectError(response, { code: ApplicationErrorCode.VALIDATION, status: 'BAD_REQUEST' });
    });

    it('should fail with validation error when password is too weak', async () => {
      // Assume
      const dto = { name: userFactory.generateName(), email: userFactory.generateEmail(), password: 'weak' };

      // Act
      const response = await gqlRequest(app, CREATE_USER, { dto });

      // Assert
      expectError(response, { code: ApplicationErrorCode.VALIDATION, status: 'BAD_REQUEST' });
    });

    it('should fail when email already exists', async () => {
      // Assume
      const existing = await userFactory.create('active');
      const dto = { name: userFactory.generateName(), email: existing.email, password: STRONG_PASSWORD };

      // Act
      const response = await gqlRequest(app, CREATE_USER, { dto });

      // Assert
      expectError(response, { code: ApplicationErrorCode.USER_ALREADY_EXISTS, status: 'BAD_REQUEST' });
    });
  });

  describe('updateUser', () => {
    it('should allow owner to update their own name, email, and password', async () => {
      // Assume
      const user = await userFactory.create('active');
      const { accessToken } = await authService.authenticateUser(user);
      const dto = { name: 'Updated Name', email: userFactory.generateEmail(), password: STRONG_PASSWORD };

      // Act
      const response = await gqlRequest(app, UPDATE_USER, { id: user.id, dto }, accessToken);

      // Assert
      expectSuccess(response);

      const updated = response.body.data.updateUser;
      expect(updated.id).toBe(user.id);
      expect(updated.name).toBe(dto.name);
      expect(updated.email).toBe(dto.email.toLowerCase());
      expect(updated.isEmailVerified).toBe(false);
    });

    it('should allow admin to update any user', async () => {
      // Assume
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const target = await userFactory.create('active');
      const { accessToken } = await authService.authenticateUser(admin);
      const dto = { name: 'Admin Updated', email: userFactory.generateEmail(), password: STRONG_PASSWORD };

      // Act
      const response = await gqlRequest(app, UPDATE_USER, { id: target.id, dto }, accessToken);

      // Assert
      expectSuccess(response);
      expect(response.body.data.updateUser.name).toBe(dto.name);
    });

    it('should keep isEmailVerified: true and not call sendConfirmEmail when email is unchanged', async () => {
      // Assume
      const user = await userFactory.create('active');
      const { accessToken } = await authService.authenticateUser(user);
      const dto = { name: 'New Name', email: user.email, password: STRONG_PASSWORD };

      // Act
      const response = await gqlRequest(app, UPDATE_USER, { id: user.id, dto }, accessToken);

      // Assert
      expectSuccess(response);
      expect(response.body.data.updateUser.isEmailVerified).toBe(true);
      expect(mockMailService.sendConfirmEmail).not.toHaveBeenCalled();

      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(dbUser.confirmEmailTempCode).toBeNull();
    });

    it('should set isEmailVerified: false and call sendConfirmEmail when owner changes email', async () => {
      // Assume
      const user = await userFactory.create('active');
      const { accessToken } = await authService.authenticateUser(user);
      const dto = { name: user.name, email: userFactory.generateEmail(), password: STRONG_PASSWORD };

      // Act
      const response = await gqlRequest(app, UPDATE_USER, { id: user.id, dto }, accessToken);

      // Assert
      expectSuccess(response);
      expect(response.body.data.updateUser.isEmailVerified).toBe(false);
      expect(mockMailService.sendConfirmEmail).toHaveBeenCalledTimes(1);
    });

    it('should set isEmailVerified: false and call sendConfirmEmail when admin changes another user email', async () => {
      // Assume
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const target = await userFactory.create('active');
      const { accessToken } = await authService.authenticateUser(admin);
      const dto = { name: target.name, email: userFactory.generateEmail(), password: STRONG_PASSWORD };

      // Act
      const response = await gqlRequest(app, UPDATE_USER, { id: target.id, dto }, accessToken);

      // Assert
      expectSuccess(response);
      expect(response.body.data.updateUser.isEmailVerified).toBe(false);
      expect(mockMailService.sendConfirmEmail).toHaveBeenCalledTimes(1);
    });

    it('should fail when unauthenticated', async () => {
      // Assume
      const user = await userFactory.create('active');
      const dto = { name: 'X', email: user.email, password: STRONG_PASSWORD };

      // Act
      const response = await gqlRequest(app, UPDATE_USER, { id: user.id, dto });

      // Assert
      expectError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should fail when user tries to update another user', async () => {
      // Assume
      const actor = await userFactory.create('active');
      const target = await userFactory.create('active');
      const { accessToken } = await authService.authenticateUser(actor);
      const dto = { name: 'X', email: target.email, password: STRONG_PASSWORD };

      // Act
      const response = await gqlRequest(app, UPDATE_USER, { id: target.id, dto }, accessToken);

      // Assert
      expectError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should fail when target user does not exist', async () => {
      // Assume
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const { accessToken } = await authService.authenticateUser(admin);
      const dto = { name: 'X', email: userFactory.generateEmail(), password: STRONG_PASSWORD };

      // Act
      const response = await gqlRequest(app, UPDATE_USER, { id: 999999, dto }, accessToken);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body?.errors).toBeDefined();
    });
  });

  describe('deleteUser', () => {
    it('should allow admin to delete a user', async () => {
      // Assume
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const target = await userFactory.create('active');
      const { accessToken } = await authService.authenticateUser(admin);

      // Act
      const response = await gqlRequest(app, DELETE_USER, { id: target.id }, accessToken);

      // Assert
      expectSuccess(response);
      expect(response.body.data.deleteUser).toBe(true);

      const dbUser = await prisma.user.findUnique({ where: { id: target.id } });
      expect(dbUser).toBeNull();
    });

    it('should fail when unauthenticated', async () => {
      // Assume
      const target = await userFactory.create('active');

      // Act
      const response = await gqlRequest(app, DELETE_USER, { id: target.id });

      // Assert
      expectError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should fail when called by a non-admin user', async () => {
      // Assume
      const actor = await userFactory.create('active');
      const target = await userFactory.create('active');
      const { accessToken } = await authService.authenticateUser(actor);

      // Act
      const response = await gqlRequest(app, DELETE_USER, { id: target.id }, accessToken);

      // Assert
      expectError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should fail when target user does not exist', async () => {
      // Assume
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const { accessToken } = await authService.authenticateUser(admin);

      // Act
      const response = await gqlRequest(app, DELETE_USER, { id: 999999 }, accessToken);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body?.errors).toBeDefined();
    });
  });

  describe('banUser', () => {
    it('should allow admin to ban an active user', async () => {
      // Assume
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const target = await userFactory.create('active');
      const { accessToken } = await authService.authenticateUser(admin);

      // Act
      const response = await gqlRequest(app, BAN_USER, { id: target.id }, accessToken);

      // Assert
      expectSuccess(response);
      expect(response.body.data.banUser.id).toBe(target.id);
      expect(response.body.data.banUser.isBanned).toBe(true);
    });

    it('should fail when user is already banned', async () => {
      // Assume
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const target = await userFactory.create('banned');
      const { accessToken } = await authService.authenticateUser(admin);

      // Act
      const response = await gqlRequest(app, BAN_USER, { id: target.id }, accessToken);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body?.errors).toBeDefined();
    });

    it('should fail when unauthenticated', async () => {
      // Assume
      const target = await userFactory.create('active');

      // Act
      const response = await gqlRequest(app, BAN_USER, { id: target.id });

      // Assert
      expectError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should fail when called by a non-admin user', async () => {
      // Assume
      const actor = await userFactory.create('active');
      const target = await userFactory.create('active');
      const { accessToken } = await authService.authenticateUser(actor);

      // Act
      const response = await gqlRequest(app, BAN_USER, { id: target.id }, accessToken);

      // Assert
      expectError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should fail when target user does not exist', async () => {
      // Assume
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const { accessToken } = await authService.authenticateUser(admin);

      // Act
      const response = await gqlRequest(app, BAN_USER, { id: 999999 }, accessToken);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body?.errors).toBeDefined();
    });
  });

  describe('unbanUser', () => {
    it('should allow admin to unban a banned user', async () => {
      // Assume
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const target = await userFactory.create('banned');
      const { accessToken } = await authService.authenticateUser(admin);

      // Act
      const response = await gqlRequest(app, UNBAN_USER, { id: target.id }, accessToken);

      // Assert
      expectSuccess(response);
      expect(response.body.data.unbanUser.id).toBe(target.id);
      expect(response.body.data.unbanUser.isBanned).toBe(false);
    });

    it('should fail when user is not banned', async () => {
      // Assume
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const target = await userFactory.create('active');
      const { accessToken } = await authService.authenticateUser(admin);

      // Act
      const response = await gqlRequest(app, UNBAN_USER, { id: target.id }, accessToken);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body?.errors).toBeDefined();
    });

    it('should fail when unauthenticated', async () => {
      // Assume
      const target = await userFactory.create('banned');

      // Act
      const response = await gqlRequest(app, UNBAN_USER, { id: target.id });

      // Assert
      expectError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should fail when called by a non-admin user', async () => {
      // Assume
      const actor = await userFactory.create('active');
      const target = await userFactory.create('banned');
      const { accessToken } = await authService.authenticateUser(actor);

      // Act
      const response = await gqlRequest(app, UNBAN_USER, { id: target.id }, accessToken);

      // Assert
      expectError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should fail when target user does not exist', async () => {
      // Assume
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const { accessToken } = await authService.authenticateUser(admin);

      // Act
      const response = await gqlRequest(app, UNBAN_USER, { id: 999999 }, accessToken);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body?.errors).toBeDefined();
    });
  });

  describe('[auto strategy]', () => {
    let autoModuleRef: TestingModule;
    let autoApp: NestApplication;
    let autoAuthService: AuthService;
    let autoUserFactory: UserFactoryService;

    beforeAll(async () => {
      process.env.CONFIRM_EMAIL_STRATEGY = 'auto';

      autoModuleRef = await Test.createTestingModule({
        imports: [TestConfigModule, TestGraphqlModule, FactoryModule, UserModule, GraphqlModule],
      }).compile();

      autoApp = autoModuleRef.createNestApplication();
      configureApp(autoApp);
      await autoApp.init();

      autoAuthService = autoModuleRef.get(AuthService);
      autoUserFactory = autoModuleRef.get(UserFactoryService);
    });

    afterAll(async () => {
      await autoApp.close();
    });

    describe('createUser', () => {
      it('should return isEmailVerified: true', async () => {
        // Assume
        const dto = {
          name: autoUserFactory.generateName(),
          email: autoUserFactory.generateEmail(),
          password: STRONG_PASSWORD,
        };

        // Act
        const response = await gqlRequest(autoApp, CREATE_USER, { dto });

        // Assert
        expectSuccess(response);
        expect(response.body.data.createUser.isEmailVerified).toBe(true);
      });
    });

    describe('updateUser', () => {
      it('should keep isEmailVerified: true after email change', async () => {
        // Assume
        const user = await autoUserFactory.create('active');
        const { accessToken } = await autoAuthService.authenticateUser(user);
        const dto = { name: user.name, email: autoUserFactory.generateEmail(), password: STRONG_PASSWORD };

        // Act
        const response = await gqlRequest(autoApp, UPDATE_USER, { id: user.id, dto }, accessToken);

        // Assert
        expectSuccess(response);
        expect(response.body.data.updateUser.isEmailVerified).toBe(true);
      });
    });
  });
});
