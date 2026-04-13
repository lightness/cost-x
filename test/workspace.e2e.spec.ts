import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { ApplicationErrorCode } from '../src/common/error/coded-application.error';
import { configureApp } from '../src/configure-app';
import { Currency } from '../src/currency-rate/entity/currency.enum';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '../src/user/entity/user-role.enum';
import { WorkspaceModule } from '../src/workspace/workspace.module';
import { FactoryModule } from './factory/factory.module';
import { UserFactoryService } from './factory/user-factory.service';
import { WorkspaceFactoryService } from './factory/workspace-factory.service';
import { TestGraphqlModule } from './graphql/test-graphql.module';
import { TestConfigModule } from './test-config.module';

const createWorkspaceMutation = `
  mutation CreateWorkspace($dto: WorkspaceInDto!) {
    createWorkspace(dto: $dto) {
      id
      title
      defaultCurrency
    }
  }
`;

const updateWorkspaceMutation = `
  mutation UpdateWorkspace($id: Int!, $dto: WorkspaceInDto!) {
    updateWorkspace(id: $id, dto: $dto) {
      id
      title
      defaultCurrency
    }
  }
`;

const deleteWorkspaceMutation = `
  mutation DeleteWorkspace($id: Int!) {
    deleteWorkspace(id: $id) {
      id
    }
  }
`;

describe('Workspace E2E', () => {
  let moduleRef: TestingModule;
  let app: NestApplication;
  let authService: AuthService;
  let prisma: PrismaService;
  let userFactory: UserFactoryService;
  let workspaceFactory: WorkspaceFactoryService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TestConfigModule, TestGraphqlModule, FactoryModule, WorkspaceModule, GraphqlModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    authService = moduleRef.get(AuthService);
    prisma = moduleRef.get(PrismaService);
    userFactory = moduleRef.get(UserFactoryService);
    workspaceFactory = moduleRef.get(WorkspaceFactoryService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('createWorkspace', () => {
    it('should create workspace when authenticated', async () => {
      // Assume
      const user = await userFactory.create('active');

      // Act
      const { accessToken } = await authService.authenticateUser(user);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: createWorkspaceMutation,
          variables: { dto: { title: 'My Workspace', defaultCurrency: Currency.USD } },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      expect(response.body.data.createWorkspace.title).toBe('My Workspace');
      expect(response.body.data.createWorkspace.defaultCurrency).toBe(Currency.USD);

      const workspace = await prisma.workspace.findUnique({
        where: { id: response.body.data.createWorkspace.id },
      });

      expect(workspace).toBeDefined();
      expect(workspace.ownerId).toBe(user.id);
    });

    it('should not create workspace when not authenticated', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: createWorkspaceMutation,
          variables: { dto: { title: 'My Workspace', defaultCurrency: Currency.USD } },
        })
        .set('Content-Type', 'application/json');

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });
  });

  describe('updateWorkspace', () => {
    it('should update workspace when user is the owner', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id, { title: 'Old Title', defaultCurrency: Currency.USD });

      // Act
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updateWorkspaceMutation,
          variables: { id: workspace.id, dto: { title: 'New Title', defaultCurrency: Currency.EUR } },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      expect(response.body.data.updateWorkspace.title).toBe('New Title');
      expect(response.body.data.updateWorkspace.defaultCurrency).toBe(Currency.EUR);
    });

    it('should not update when not authenticated', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);

      // Act
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updateWorkspaceMutation,
          variables: { id: workspace.id, dto: { title: 'New Title', defaultCurrency: Currency.USD } },
        })
        .set('Content-Type', 'application/json');

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not update when user is not the owner', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const stranger = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);

      // Act
      const { accessToken } = await authService.authenticateUser(stranger);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updateWorkspaceMutation,
          variables: { id: workspace.id, dto: { title: 'New Title', defaultCurrency: Currency.USD } },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should allow admin to update any workspace', async () => {
      // Assume
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id, { title: 'Old Title' });

      // Act
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updateWorkspaceMutation,
          variables: { id: workspace.id, dto: { title: 'New Title', defaultCurrency: Currency.EUR } },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      expect(response.body.data.updateWorkspace.title).toBe('New Title');
    });
  });

  describe('deleteWorkspace', () => {
    it('should delete workspace when user is the owner', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);

      // Act
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: deleteWorkspaceMutation,
          variables: { id: workspace.id },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      expect(response.body.data.deleteWorkspace.id).toBe(workspace.id);

      const deleted = await prisma.workspace.findUnique({ where: { id: workspace.id } });

      expect(deleted).toBeNull();
    });

    it('should not delete when not authenticated', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);

      // Act
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: deleteWorkspaceMutation,
          variables: { id: workspace.id },
        })
        .set('Content-Type', 'application/json');

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not delete when user is not the owner', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const stranger = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);

      // Act
      const { accessToken } = await authService.authenticateUser(stranger);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: deleteWorkspaceMutation,
          variables: { id: workspace.id },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should allow admin to delete any workspace', async () => {
      // Assume
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);

      // Act
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: deleteWorkspaceMutation,
          variables: { id: workspace.id },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);

      const deleted = await prisma.workspace.findUnique({ where: { id: workspace.id } });

      expect(deleted).toBeNull();
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
