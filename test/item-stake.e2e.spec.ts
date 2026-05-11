import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { configureApp } from '../src/configure-app';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { ItemStakeModule } from '../src/item-stake/item-stake.module';
import { StakeRule } from '../src/workspace-stake/entity/stake-rule.enum';
import { WorkspaceStakeModule } from '../src/workspace-stake/workspace-stake.module';
import { WorkspaceModule } from '../src/workspace/workspace.module';
import { WorkspaceMembershipModule } from '../src/workspace-membership/workspace-membership.module';
import { FactoryModule } from './factory/factory.module';
import { UserFactoryService } from './factory/user-factory.service';
import { WorkspaceFactoryService } from './factory/workspace-factory.service';
import { TestGraphqlModule } from './graphql/test-graphql.module';
import { TestConfigModule } from './test-config.module';

const createItemMutation = `
  mutation CreateItem($workspaceId: Int!, $dto: ItemInDto!) {
    createItem(workspaceId: $workspaceId, dto: $dto) {
      id
      stakeRule
    }
  }
`;

const updateWorkspaceStakeRuleMutation = `
  mutation UpdateWorkspaceStakeRule($workspaceId: Int!, $stakeRule: StakeRule!) {
    updateWorkspaceStakeRule(workspaceId: $workspaceId, stakeRule: $stakeRule) {
      id
      stakeRule
    }
  }
`;

describe('Item Stake E2E', () => {
  let moduleRef: TestingModule;
  let app: NestApplication;
  let authService: AuthService;
  let userFactory: UserFactoryService;
  let workspaceFactory: WorkspaceFactoryService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TestConfigModule,
        TestGraphqlModule,
        FactoryModule,
        WorkspaceModule,
        WorkspaceMembershipModule,
        WorkspaceStakeModule,
        ItemStakeModule,
        GraphqlModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    authService = moduleRef.get(AuthService);
    userFactory = moduleRef.get(UserFactoryService);
    workspaceFactory = moduleRef.get(WorkspaceFactoryService);
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // item stakeRule inheritance
  // ---------------------------------------------------------------------------

  describe('item stakeRule inheritance', () => {
    it('should inherit default workspace stakeRule (ALL_PAYER) on item creation', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });

      // Act
      const { accessToken } = await authService.authenticateUser(owner);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: createItemMutation,
          variables: { dto: { title: 'Test Item' }, workspaceId: workspace.id },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      expect(response.body.data.createItem.stakeRule).toBe(StakeRule.ALL_PAYER);
    });

    it('should inherit updated workspace stakeRule on item creation', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const { accessToken } = await authService.authenticateUser(owner);

      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updateWorkspaceStakeRuleMutation,
          variables: { stakeRule: StakeRule.EQUALLY, workspaceId: workspace.id },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Act
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: createItemMutation,
          variables: { dto: { title: 'Test Item' }, workspaceId: workspace.id },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      expect(response.body.data.createItem.stakeRule).toBe(StakeRule.EQUALLY);
    });

    it('should not affect existing items when workspace stakeRule is updated', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const { accessToken } = await authService.authenticateUser(owner);

      const existingItemResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: createItemMutation,
          variables: { dto: { title: 'Existing Item' }, workspaceId: workspace.id },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(existingItemResponse);
      const existingItemStakeRule = existingItemResponse.body.data.createItem.stakeRule;

      // Act — update workspace stakeRule then create a new item
      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updateWorkspaceStakeRuleMutation,
          variables: { stakeRule: StakeRule.EQUALLY, workspaceId: workspace.id },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: createItemMutation,
          variables: { dto: { title: 'New Item' }, workspaceId: workspace.id },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert — new item gets new rule, existing item stakeRule is unchanged
      expectResponseSuccess(response);
      expect(response.body.data.createItem.stakeRule).toBe(StakeRule.EQUALLY);
      expect(existingItemStakeRule).toBe(StakeRule.ALL_PAYER);
    });
  });

  function expectResponseSuccess(response: any) {
    expect(response.status).toBe(200);
    expect(response.body?.errors).toBeUndefined();
    expect(response.body?.data).toBeDefined();
  }
});
