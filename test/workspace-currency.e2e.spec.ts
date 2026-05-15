import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { WorkspacePermission } from '../generated/prisma/client';
import { AuthService } from '../src/auth/auth.service';
import { ApplicationErrorCode } from '../src/common/error/coded-application.error';
import { configureApp } from '../src/configure-app';
import { Currency } from '../src/currency-rate/entity/currency.enum';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { UserRole } from '../src/user/entity/user-role.enum';
import { WorkspaceCurrencyModule } from '../src/workspace-currency/workspace-currency.module';
import { WorkspaceMembershipModule } from '../src/workspace-membership/workspace-membership.module';
import { WorkspaceModule } from '../src/workspace/workspace.module';
import { FactoryModule } from './factory/factory.module';
import { UserFactoryService } from './factory/user-factory.service';
import { WorkspaceFactoryService } from './factory/workspace-factory.service';
import { WorkspaceMemberFactoryService } from './factory/workspace-member-factory.service';
import { TestGraphqlModule } from './graphql/test-graphql.module';
import { TestConfigModule } from './test-config.module';

const updateWorkspaceDefaultCurrencyMutation = `
  mutation UpdateWorkspaceDefaultCurrency($workspaceId: Int!, $defaultCurrency: Currency!) {
    updateWorkspaceDefaultCurrency(workspaceId: $workspaceId, defaultCurrency: $defaultCurrency) {
      id
      defaultCurrency
    }
  }
`;

describe('Workspace Currency E2E', () => {
  let moduleRef: TestingModule;
  let app: NestApplication;
  let authService: AuthService;
  let userFactory: UserFactoryService;
  let workspaceFactory: WorkspaceFactoryService;
  let workspaceMemberFactory: WorkspaceMemberFactoryService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TestConfigModule,
        TestGraphqlModule,
        FactoryModule,
        WorkspaceModule,
        WorkspaceMembershipModule,
        WorkspaceCurrencyModule,
        GraphqlModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    authService = moduleRef.get(AuthService);
    userFactory = moduleRef.get(UserFactoryService);
    workspaceFactory = moduleRef.get(WorkspaceFactoryService);
    workspaceMemberFactory = moduleRef.get(WorkspaceMemberFactoryService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('updateWorkspaceDefaultCurrency', () => {
    it('should update default currency when user is the owner', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({
        defaultCurrency: Currency.USD,
        ownerId: owner.id,
      });

      // Act
      const { accessToken } = await authService.authenticateUser(owner);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updateWorkspaceDefaultCurrencyMutation,
          variables: { defaultCurrency: Currency.EUR, workspaceId: workspace.id },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      expect(response.body.data.updateWorkspaceDefaultCurrency.id).toBe(workspace.id);
      expect(response.body.data.updateWorkspaceDefaultCurrency.defaultCurrency).toBe(Currency.EUR);
    });

    it('should update default currency when member has UPDATE_WORKSPACE_DEFAULT_CURRENCY permission', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const member = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });

      await workspaceMemberFactory.create(workspace.id, member.id, {
        permissions: [WorkspacePermission.UPDATE_WORKSPACE_DEFAULT_CURRENCY],
      });

      // Act
      const { accessToken } = await authService.authenticateUser(member);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updateWorkspaceDefaultCurrencyMutation,
          variables: { defaultCurrency: Currency.BYN, workspaceId: workspace.id },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      expect(response.body.data.updateWorkspaceDefaultCurrency.defaultCurrency).toBe(Currency.BYN);
    });

    it('should not update when member lacks UPDATE_WORKSPACE_DEFAULT_CURRENCY permission', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const member = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });

      await workspaceMemberFactory.create(workspace.id, member.id, {
        permissions: Object.values(WorkspacePermission).filter(
          (p) => p !== WorkspacePermission.UPDATE_WORKSPACE_DEFAULT_CURRENCY,
        ),
      });

      // Act
      const { accessToken } = await authService.authenticateUser(member);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updateWorkspaceDefaultCurrencyMutation,
          variables: { defaultCurrency: Currency.EUR, workspaceId: workspace.id },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not update when user is not a member of the workspace', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const stranger = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });

      // Act
      const { accessToken } = await authService.authenticateUser(stranger);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updateWorkspaceDefaultCurrencyMutation,
          variables: { defaultCurrency: Currency.EUR, workspaceId: workspace.id },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not update when not authenticated', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });

      // Act
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updateWorkspaceDefaultCurrencyMutation,
          variables: { defaultCurrency: Currency.EUR, workspaceId: workspace.id },
        })
        .set('Content-Type', 'application/json');

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should allow admin to update default currency of any workspace', async () => {
      // Assume
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({
        defaultCurrency: Currency.USD,
        ownerId: owner.id,
      });

      // Act
      const { accessToken } = await authService.authenticateUser(admin);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updateWorkspaceDefaultCurrencyMutation,
          variables: { defaultCurrency: Currency.BYN, workspaceId: workspace.id },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      expect(response.body.data.updateWorkspaceDefaultCurrency.defaultCurrency).toBe(Currency.BYN);
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
