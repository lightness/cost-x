import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { ApplicationErrorCode } from '../src/common/error/coded-application.error';
import { configureApp } from '../src/configure-app';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { UserRole } from '../src/user/entity/user-role.enum';
import { UserModule } from '../src/user/user.module';
import { FactoryModule } from './factory/factory.module';
import { UserFactoryService } from './factory/user-factory.service';
import { TestGraphqlModule } from './graphql/test-graphql.module';
import { TestConfigModule } from './test-config.module';

const usersQuery = `
  query Users {
    users {
      id
    }
  }
`;

const userQuery = `
  query User($id: Int!) {
    user(id: $id) {
      id
    }
  }
`;

const meQuery = `
  query Me {
    me {
      id
    }
  }
`;

describe('UserQuery E2E', () => {
  let moduleRef: TestingModule;
  let app: NestApplication;
  let authService: AuthService;
  let userFactory: UserFactoryService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TestConfigModule, TestGraphqlModule, FactoryModule, UserModule, GraphqlModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    authService = moduleRef.get(AuthService);
    userFactory = moduleRef.get(UserFactoryService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('users', () => {
    it('should return users when admin', async () => {
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });

      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: usersQuery })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.users).toBeDefined();
    });

    it('should not return users when regular user', async () => {
      const user = await userFactory.create('active');

      const { accessToken } = await authService.authenticateUser(user);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: usersQuery })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not return users when not authenticated', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: usersQuery })
        .set('Content-Type', 'application/json');

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });
  });

  describe('user', () => {
    it('should return user when querying own profile', async () => {
      const user = await userFactory.create('active');

      const { accessToken } = await authService.authenticateUser(user);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: userQuery, variables: { id: user.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.user.id).toBe(user.id);
    });

    it('should not return user when querying another user profile', async () => {
      const user = await userFactory.create('active');
      const other = await userFactory.create('active');

      const { accessToken } = await authService.authenticateUser(user);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: userQuery, variables: { id: other.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not return user when not authenticated', async () => {
      const user = await userFactory.create('active');

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: userQuery, variables: { id: user.id } })
        .set('Content-Type', 'application/json');

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should return user when admin', async () => {
      const user = await userFactory.create('active');
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });

      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: userQuery, variables: { id: user.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.user.id).toBe(user.id);
    });
  });

  describe('me', () => {
    it('should return current user when authenticated', async () => {
      const user = await userFactory.create('active');

      const { accessToken } = await authService.authenticateUser(user);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: meQuery })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.me.id).toBe(user.id);
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
