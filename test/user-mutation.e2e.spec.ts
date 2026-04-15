import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { ApplicationErrorCode } from '../src/common/error/coded-application.error';
import { configureApp } from '../src/configure-app';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '../src/user/entity/user-role.enum';
import { UserModule } from '../src/user/user.module';
import { FactoryModule } from './factory/factory.module';
import { UserFactoryService } from './factory/user-factory.service';
import { TestGraphqlModule } from './graphql/test-graphql.module';
import { TestConfigModule } from './test-config.module';

const STRONG_PASSWORD = 'Test-12345!';

const updateUserMutation = `
  mutation UpdateUser($id: Int!, $dto: UpdateUserInDto!) {
    updateUser(id: $id, dto: $dto) {
      id
      name
    }
  }
`;

const deleteUserMutation = `
  mutation DeleteUser($id: Int!) {
    deleteUser(id: $id)
  }
`;

const banUserMutation = `
  mutation BanUser($id: Int!) {
    banUser(id: $id) {
      id
      isBanned
    }
  }
`;

const unbanUserMutation = `
  mutation UnbanUser($id: Int!) {
    unbanUser(id: $id) {
      id
      isBanned
    }
  }
`;

describe('UserMutation E2E', () => {
  let moduleRef: TestingModule;
  let app: NestApplication;
  let authService: AuthService;
  let prisma: PrismaService;
  let userFactory: UserFactoryService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TestConfigModule, TestGraphqlModule, FactoryModule, UserModule, GraphqlModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    authService = moduleRef.get(AuthService);
    prisma = moduleRef.get(PrismaService);
    userFactory = moduleRef.get(UserFactoryService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('updateUser', () => {
    it('should update user when owner', async () => {
      // Assume
      const user = await userFactory.create('active');
      const dto = { name: 'New Name', email: userFactory.generateEmail(), password: STRONG_PASSWORD };

      // Act
      const { accessToken } = await authService.authenticateUser(user);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updateUserMutation, variables: { id: user.id, dto } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      expect(response.body.data.updateUser.name).toBe('New Name');
    });

    it('should not update when not authenticated', async () => {
      // Assume
      const user = await userFactory.create('active');
      const dto = { name: 'New Name', email: userFactory.generateEmail(), password: STRONG_PASSWORD };

      // Act
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updateUserMutation, variables: { id: user.id, dto } })
        .set('Content-Type', 'application/json');

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not update when user is not the target', async () => {
      // Assume
      const user = await userFactory.create('active');
      const otherUser = await userFactory.create('active');
      const dto = { name: 'New Name', email: userFactory.generateEmail(), password: STRONG_PASSWORD };

      // Act
      const { accessToken } = await authService.authenticateUser(user);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updateUserMutation, variables: { id: otherUser.id, dto } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should allow admin to update any user', async () => {
      // Assume
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const user = await userFactory.create('active');
      const dto = { name: 'New Name', email: userFactory.generateEmail(), password: STRONG_PASSWORD };

      // Act
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updateUserMutation, variables: { id: user.id, dto } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      expect(response.body.data.updateUser.name).toBe('New Name');
    });
  });

  describe('deleteUser', () => {
    it('should delete user when admin', async () => {
      // Assume
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const user = await userFactory.create('active');

      // Act
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: deleteUserMutation, variables: { id: user.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      expect(response.body.data.deleteUser).toBe(true);

      const deleted = await prisma.user.findUnique({ where: { id: user.id } });

      expect(deleted).toBeNull();
    });

    it('should not delete when not authenticated', async () => {
      // Assume
      const user = await userFactory.create('active');

      // Act
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: deleteUserMutation, variables: { id: user.id } })
        .set('Content-Type', 'application/json');

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not delete when called by non-admin', async () => {
      // Assume
      const user = await userFactory.create('active');
      const otherUser = await userFactory.create('active');

      // Act
      const { accessToken } = await authService.authenticateUser(user);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: deleteUserMutation, variables: { id: otherUser.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });
  });

  describe('banUser', () => {
    it('should ban user when admin', async () => {
      // Assume
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const user = await userFactory.create('active');

      // Act
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: banUserMutation, variables: { id: user.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      expect(response.body.data.banUser.isBanned).toBe(true);
    });

    it('should not ban when not authenticated', async () => {
      // Assume
      const user = await userFactory.create('active');

      // Act
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: banUserMutation, variables: { id: user.id } })
        .set('Content-Type', 'application/json');

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not ban when called by non-admin', async () => {
      // Assume
      const user = await userFactory.create('active');
      const otherUser = await userFactory.create('active');

      // Act
      const { accessToken } = await authService.authenticateUser(user);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: banUserMutation, variables: { id: otherUser.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });
  });

  describe('unbanUser', () => {
    it('should unban user when admin', async () => {
      // Assume
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const user = await userFactory.create('banned');

      // Act
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: unbanUserMutation, variables: { id: user.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      expect(response.body.data.unbanUser.isBanned).toBe(false);
    });

    it('should not unban when not authenticated', async () => {
      // Assume
      const user = await userFactory.create('banned');

      // Act
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: unbanUserMutation, variables: { id: user.id } })
        .set('Content-Type', 'application/json');

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not unban when called by non-admin', async () => {
      // Assume
      const user = await userFactory.create('active');
      const bannedUser = await userFactory.create('banned');

      // Act
      const { accessToken } = await authService.authenticateUser(user);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: unbanUserMutation, variables: { id: bannedUser.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });
  });

  function expectResponseSuccess(response: any) {
    expect(response.status).toBe(200);
    expect(response.body?.errors).toBeUndefined();
    expect(response.body?.data).toBeDefined();
  }

  function expectResponseError(response: any, { code, status }: { code: string; status: string }) {
    expect(response.status).toBe(200);
    expect(response.body?.errors).toBeDefined();
    expect(response.body?.errors?.[0]?.code).toBe(code);
    expect(response.body?.errors?.[0]?.status).toBe(status);
  }
});
