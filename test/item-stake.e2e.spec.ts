import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { ApplicationErrorCode } from '../src/common/error/coded-application.error';
import { configureApp } from '../src/configure-app';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { ItemStakeModule } from '../src/item-stake/item-stake.module';
import { UserRole } from '../src/user/entity/user-role.enum';
import { StakeRule } from '../src/workspace-stake/entity/stake-rule.enum';
import { WorkspaceStakeModule } from '../src/workspace-stake/workspace-stake.module';
import { WorkspaceModule } from '../src/workspace/workspace.module';
import { WorkspaceMembershipModule } from '../src/workspace-membership/workspace-membership.module';
import { FactoryModule } from './factory/factory.module';
import { ItemFactoryService } from './factory/item-factory.service';
import { UserFactoryService } from './factory/user-factory.service';
import { WorkspaceFactoryService } from './factory/workspace-factory.service';
import { WorkspaceMemberFactoryService } from './factory/workspace-member-factory.service';
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

const setItemStakeRuleMutation = `
  mutation SetItemStakeRule($itemId: Int!, $stakeRule: StakeRule!) {
    setItemStakeRule(itemId: $itemId, stakeRule: $stakeRule) {
      id
      stakeRule
    }
  }
`;

const setItemStakesMutation = `
  mutation SetItemStakes($itemId: Int!, $stakes: [MemberStake!]!) {
    setItemStakes(itemId: $itemId, stakes: $stakes) {
      id
      workspaceMemberId
      value
    }
  }
`;

const itemQuery = `
  query Item($id: Int!) {
    item(id: $id) {
      id
      stakeRule
      itemStakes {
        id
        workspaceMemberId
        value
      }
    }
  }
`;

describe('Item Stake E2E', () => {
  let moduleRef: TestingModule;
  let app: NestApplication;
  let authService: AuthService;
  let userFactory: UserFactoryService;
  let workspaceFactory: WorkspaceFactoryService;
  let itemFactory: ItemFactoryService;
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
    itemFactory = moduleRef.get(ItemFactoryService);
    workspaceMemberFactory = moduleRef.get(WorkspaceMemberFactoryService);
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

  // ---------------------------------------------------------------------------
  // setItemStakeRule
  // ---------------------------------------------------------------------------

  describe('setItemStakeRule', () => {
    it('should set stakeRule when user is the owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakeRuleMutation,
          variables: { itemId: item.id, stakeRule: StakeRule.EQUALLY },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.setItemStakeRule.stakeRule).toBe(StakeRule.EQUALLY);
    });

    it('should set stakeRule when member has OVERRIDE_ITEM_STAKES permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const member = await userFactory.create('active');
      await workspaceMemberFactory.create(workspace.id, member.id);
      const { accessToken } = await authService.authenticateUser(member);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakeRuleMutation,
          variables: { itemId: item.id, stakeRule: StakeRule.EQUALLY },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.setItemStakeRule.stakeRule).toBe(StakeRule.EQUALLY);
    });

    it('should not set stakeRule when member lacks OVERRIDE_ITEM_STAKES permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const member = await userFactory.create('active');
      await workspaceMemberFactory.create(workspace.id, member.id, { permissions: [] });
      const { accessToken } = await authService.authenticateUser(member);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakeRuleMutation,
          variables: { itemId: item.id, stakeRule: StakeRule.EQUALLY },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not set stakeRule when not authenticated', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakeRuleMutation,
          variables: { itemId: item.id, stakeRule: StakeRule.EQUALLY },
        })
        .set('Content-Type', 'application/json');

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not set stakeRule when user is not a workspace member', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const stranger = await userFactory.create('active');
      const { accessToken } = await authService.authenticateUser(stranger);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakeRuleMutation,
          variables: { itemId: item.id, stakeRule: StakeRule.EQUALLY },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should allow admin to set stakeRule on any workspace item', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakeRuleMutation,
          variables: { itemId: item.id, stakeRule: StakeRule.EQUALLY },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.setItemStakeRule.stakeRule).toBe(StakeRule.EQUALLY);
    });

    it('should clear item stakes when stakeRule is set', async () => {
      // Assume — create item with a member stake
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const member = await workspaceMemberFactory.create(workspace.id, owner.id);
      const { accessToken } = await authService.authenticateUser(owner);

      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakesMutation,
          variables: { itemId: item.id, stakes: [{ value: 1.0, workspaceMemberId: member.id }] },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Act — set a stakeRule on the item
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakeRuleMutation,
          variables: { itemId: item.id, stakeRule: StakeRule.EQUALLY },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.setItemStakeRule.stakeRule).toBe(StakeRule.EQUALLY);

      // Assert — item stakes are cleared
      const itemResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: itemQuery, variables: { id: item.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(itemResponse);
      expect(itemResponse.body.data.item.itemStakes).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // setItemStakes
  // ---------------------------------------------------------------------------

  describe('setItemStakes', () => {
    it('should set item stakes when user is the owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      // No workspace members → empty stakes is valid
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakesMutation,
          variables: { itemId: item.id, stakes: [] },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.setItemStakes).toEqual([]);
    });

    it('should set item stakes when member has OVERRIDE_ITEM_STAKES permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const member = await userFactory.create('active');
      const memberRecord = await workspaceMemberFactory.create(workspace.id, member.id);
      const { accessToken } = await authService.authenticateUser(member);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakesMutation,
          variables: {
            itemId: item.id,
            stakes: [{ value: 1.0, workspaceMemberId: memberRecord.id }],
          },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.setItemStakes).toHaveLength(1);
      expect(response.body.data.setItemStakes[0].workspaceMemberId).toBe(memberRecord.id);
    });

    it('should not set item stakes when member lacks OVERRIDE_ITEM_STAKES permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const member = await userFactory.create('active');
      await workspaceMemberFactory.create(workspace.id, member.id, { permissions: [] });
      const { accessToken } = await authService.authenticateUser(member);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakesMutation,
          variables: { itemId: item.id, stakes: [] },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not set item stakes when not authenticated', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakesMutation,
          variables: { itemId: item.id, stakes: [] },
        })
        .set('Content-Type', 'application/json');

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not set item stakes when user is not a workspace member', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const stranger = await userFactory.create('active');
      const { accessToken } = await authService.authenticateUser(stranger);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakesMutation,
          variables: { itemId: item.id, stakes: [] },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should allow admin to set item stakes on any workspace item', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakesMutation,
          variables: { itemId: item.id, stakes: [] },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.setItemStakes).toEqual([]);
    });

    it('should set item.stakeRule to null when stakes are set', async () => {
      // Assume — create item inheriting workspace stakeRule = ALL_PAYER
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const memberRecord = await workspaceMemberFactory.create(workspace.id, owner.id);
      const { accessToken } = await authService.authenticateUser(owner);

      // Act — set individual stakes
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakesMutation,
          variables: {
            itemId: item.id,
            stakes: [{ value: 1.0, workspaceMemberId: memberRecord.id }],
          },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.setItemStakes).toHaveLength(1);

      // Assert — item.stakeRule is null
      const itemResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: itemQuery, variables: { id: item.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(itemResponse);
      expect(itemResponse.body.data.item.stakeRule).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // helpers
  // ---------------------------------------------------------------------------

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
