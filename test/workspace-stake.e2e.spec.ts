import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { WorkspacePermission } from '../generated/prisma/client';
import { AuthService } from '../src/auth/auth.service';
import { ApplicationErrorCode } from '../src/common/error/coded-application.error';
import { configureApp } from '../src/configure-app';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { StakeRule } from '../src/workspace-stake/entity/stake-rule.enum';
import { WorkspaceStakeModule } from '../src/workspace-stake/workspace-stake.module';
import { UserRole } from '../src/user/entity/user-role.enum';
import { WorkspaceModule } from '../src/workspace/workspace.module';
import { WorkspaceMembershipModule } from '../src/workspace-membership/workspace-membership.module';
import { FactoryModule } from './factory/factory.module';
import { UserFactoryService } from './factory/user-factory.service';
import { WorkspaceFactoryService } from './factory/workspace-factory.service';
import { WorkspaceMemberFactoryService } from './factory/workspace-member-factory.service';
import { TestGraphqlModule } from './graphql/test-graphql.module';
import { TestConfigModule } from './test-config.module';

const updateWorkspaceStakeRuleMutation = `
  mutation UpdateWorkspaceStakeRule($workspaceId: Int!, $stakeRule: StakeRule!) {
    updateWorkspaceStakeRule(workspaceId: $workspaceId, stakeRule: $stakeRule) {
      id
      stakeRule
    }
  }
`;

describe('Workspace Stake E2E', () => {
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
        WorkspaceStakeModule,
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

  describe('updateWorkspaceStakeRule', () => {
    it('should update stake rule when user is the owner', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });

      // Act
      const { accessToken } = await authService.authenticateUser(owner);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updateWorkspaceStakeRuleMutation,
          variables: { stakeRule: StakeRule.EQUALLY, workspaceId: workspace.id },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      expect(response.body.data.updateWorkspaceStakeRule.id).toBe(workspace.id);
      expect(response.body.data.updateWorkspaceStakeRule.stakeRule).toBe(StakeRule.EQUALLY);
    });

    it('should update stake rule when member has UPDATE_WORKSPACE_STAKE_RULE permission', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const member = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });

      await workspaceMemberFactory.create(workspace.id, member.id, {
        permissions: [WorkspacePermission.UPDATE_WORKSPACE_STAKE_RULE],
      });

      // Act
      const { accessToken } = await authService.authenticateUser(member);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updateWorkspaceStakeRuleMutation,
          variables: { stakeRule: StakeRule.ALL_PAYER, workspaceId: workspace.id },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      expect(response.body.data.updateWorkspaceStakeRule.stakeRule).toBe(StakeRule.ALL_PAYER);
    });

    it('should not update when member lacks UPDATE_WORKSPACE_STAKE_RULE permission', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const member = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });

      await workspaceMemberFactory.create(workspace.id, member.id, {
        permissions: Object.values(WorkspacePermission).filter(
          (p) => p !== WorkspacePermission.UPDATE_WORKSPACE_STAKE_RULE,
        ),
      });

      // Act
      const { accessToken } = await authService.authenticateUser(member);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updateWorkspaceStakeRuleMutation,
          variables: { stakeRule: StakeRule.EQUALLY, workspaceId: workspace.id },
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
          query: updateWorkspaceStakeRuleMutation,
          variables: { stakeRule: StakeRule.EQUALLY, workspaceId: workspace.id },
        })
        .set('Content-Type', 'application/json');

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
          query: updateWorkspaceStakeRuleMutation,
          variables: { stakeRule: StakeRule.EQUALLY, workspaceId: workspace.id },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should allow admin to update stake rule of any workspace', async () => {
      // Assume
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });

      // Act
      const { accessToken } = await authService.authenticateUser(admin);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updateWorkspaceStakeRuleMutation,
          variables: { stakeRule: StakeRule.ALL_WORKSPACE_OWNER, workspaceId: workspace.id },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      expect(response.body.data.updateWorkspaceStakeRule.stakeRule).toBe(
        StakeRule.ALL_WORKSPACE_OWNER,
      );
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
