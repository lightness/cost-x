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
      const member = await workspaceMemberFactory.create(workspace.id, owner.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakesMutation,
          variables: { itemId: item.id, stakes: [{ value: 1.0, workspaceMemberId: member.id }] },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.setItemStakes).toHaveLength(1);
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
      const member = await workspaceMemberFactory.create(workspace.id, owner.id);
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakesMutation,
          variables: { itemId: item.id, stakes: [{ value: 1.0, workspaceMemberId: member.id }] },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.setItemStakes).toHaveLength(1);
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
  // setItemStakes validation
  // ---------------------------------------------------------------------------

  describe('setItemStakes validation', () => {
    const removeWorkspaceMemberMutation = `
      mutation RemoveWorkspaceMember($memberId: Int!) {
        removeWorkspaceMember(memberId: $memberId) {
          id
        }
      }
    `;

    // --- happy paths ---

    it('should accept stakes for all active members with positive values', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const user1 = await userFactory.create('active');
      const user2 = await userFactory.create('active');
      const member1 = await workspaceMemberFactory.create(workspace.id, user1.id);
      const member2 = await workspaceMemberFactory.create(workspace.id, user2.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakesMutation,
          variables: {
            itemId: item.id,
            stakes: [
              { value: 3.0, workspaceMemberId: member1.id },
              { value: 1.0, workspaceMemberId: member2.id },
            ],
          },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.setItemStakes).toHaveLength(2);
    });

    it('should accept stakes with some zero values when total is positive', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const user1 = await userFactory.create('active');
      const user2 = await userFactory.create('active');
      const member1 = await workspaceMemberFactory.create(workspace.id, user1.id);
      const member2 = await workspaceMemberFactory.create(workspace.id, user2.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakesMutation,
          variables: {
            itemId: item.id,
            stakes: [
              { value: 1.0, workspaceMemberId: member1.id },
              { value: 0.0, workspaceMemberId: member2.id },
            ],
          },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.setItemStakes).toHaveLength(2);
    });

    it('should be idempotent — calling setItemStakes twice produces the same result', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const user1 = await userFactory.create('active');
      const member1 = await workspaceMemberFactory.create(workspace.id, user1.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const stakes = [{ value: 1.0, workspaceMemberId: member1.id }];

      const first = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: setItemStakesMutation, variables: { itemId: item.id, stakes } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      const second = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: setItemStakesMutation, variables: { itemId: item.id, stakes } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(first);
      expectResponseSuccess(second);
      expect(second.body.data.setItemStakes).toHaveLength(1);
      expect(second.body.data.setItemStakes[0].workspaceMemberId).toBe(member1.id);
      expect(second.body.data.setItemStakes[0].value).toBe(1.0);
    });

    // --- validation failures (checked in declaration order) ---

    it('should reject duplicate workspaceMemberId', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const user1 = await userFactory.create('active');
      const member1 = await workspaceMemberFactory.create(workspace.id, user1.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakesMutation,
          variables: {
            itemId: item.id,
            stakes: [
              { value: 1.0, workspaceMemberId: member1.id },
              { value: 2.0, workspaceMemberId: member1.id },
            ],
          },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, {
        code: ApplicationErrorCode.WORKSPACE_MEMBER_STAKE_DUPLICATED,
        status: 'BAD_REQUEST',
      });
    });

    it('should reject when an active member is missing from stakes', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const user1 = await userFactory.create('active');
      const user2 = await userFactory.create('active');
      const member1 = await workspaceMemberFactory.create(workspace.id, user1.id);
      await workspaceMemberFactory.create(workspace.id, user2.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakesMutation,
          variables: {
            itemId: item.id,
            stakes: [{ value: 1.0, workspaceMemberId: member1.id }],
          },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, {
        code: ApplicationErrorCode.WORKSPACE_MEMBER_STAKE_NOT_SPECIFIED,
        status: 'BAD_REQUEST',
      });
    });

    it('should reject when stakes include a non-member id', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const user1 = await userFactory.create('active');
      const member1 = await workspaceMemberFactory.create(workspace.id, user1.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakesMutation,
          variables: {
            itemId: item.id,
            stakes: [
              { value: 1.0, workspaceMemberId: member1.id },
              { value: 1.0, workspaceMemberId: 999999 },
            ],
          },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, {
        code: ApplicationErrorCode.WORKSPACE_MEMBER_NOT_BELONGING_TO_WORKSPACE,
        status: 'NOT_FOUND',
      });
    });

    it('should reject when stakes include an inactive (removed) member id', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const user1 = await userFactory.create('active');
      const user2 = await userFactory.create('active');
      const member1 = await workspaceMemberFactory.create(workspace.id, user1.id);
      const member2 = await workspaceMemberFactory.create(workspace.id, user2.id);
      const { accessToken } = await authService.authenticateUser(owner);

      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: removeWorkspaceMemberMutation,
          variables: { memberId: member2.id },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakesMutation,
          variables: {
            itemId: item.id,
            stakes: [
              { value: 1.0, workspaceMemberId: member1.id },
              { value: 1.0, workspaceMemberId: member2.id },
            ],
          },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, {
        code: ApplicationErrorCode.WORKSPACE_MEMBER_NOT_BELONGING_TO_WORKSPACE,
        status: 'NOT_FOUND',
      });
    });

    it('should reject a negative stake value', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const user1 = await userFactory.create('active');
      const member1 = await workspaceMemberFactory.create(workspace.id, user1.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakesMutation,
          variables: {
            itemId: item.id,
            stakes: [{ value: -1.0, workspaceMemberId: member1.id }],
          },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, {
        code: ApplicationErrorCode.WORKSPACE_MEMBER_STAKE_HAS_NEGATIVE_VALUE,
        status: 'BAD_REQUEST',
      });
    });

    it('should reject when all stake values are zero (sum = 0)', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const user1 = await userFactory.create('active');
      const member1 = await workspaceMemberFactory.create(workspace.id, user1.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakesMutation,
          variables: {
            itemId: item.id,
            stakes: [{ value: 0, workspaceMemberId: member1.id }],
          },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, {
        code: ApplicationErrorCode.NON_POSITIVE_SUM_OF_STAKE_VALUES,
        status: 'BAD_REQUEST',
      });
    });

    // --- edge cases: validation check ordering ---

    it('should report missing member before negative value', async () => {
      // member1 has a negative value AND member2 is missing — missing check fires first
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const user1 = await userFactory.create('active');
      const user2 = await userFactory.create('active');
      const member1 = await workspaceMemberFactory.create(workspace.id, user1.id);
      await workspaceMemberFactory.create(workspace.id, user2.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakesMutation,
          variables: {
            itemId: item.id,
            stakes: [{ value: -1.0, workspaceMemberId: member1.id }],
          },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, {
        code: ApplicationErrorCode.WORKSPACE_MEMBER_STAKE_NOT_SPECIFIED,
        status: 'BAD_REQUEST',
      });
    });

    it('should report negative value before non-positive sum', async () => {
      // member1: -1, member2: 5 — sum is 4 > 0, but negative check fires first
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const user1 = await userFactory.create('active');
      const user2 = await userFactory.create('active');
      const member1 = await workspaceMemberFactory.create(workspace.id, user1.id);
      const member2 = await workspaceMemberFactory.create(workspace.id, user2.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakesMutation,
          variables: {
            itemId: item.id,
            stakes: [
              { value: -1.0, workspaceMemberId: member1.id },
              { value: 5.0, workspaceMemberId: member2.id },
            ],
          },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, {
        code: ApplicationErrorCode.WORKSPACE_MEMBER_STAKE_HAS_NEGATIVE_VALUE,
        status: 'BAD_REQUEST',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // stake resolution priority
  // ---------------------------------------------------------------------------

  describe('stake resolution priority', () => {
    it('should preserve item stakeRule override when workspace default changes', async () => {
      // Assume — item inherits ALL_PAYER, then gets explicitly overridden to EQUALLY
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: setItemStakeRuleMutation,
          variables: { itemId: item.id, stakeRule: StakeRule.EQUALLY },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Act — change workspace default back to ALL_PAYER
      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updateWorkspaceStakeRuleMutation,
          variables: { stakeRule: StakeRule.ALL_PAYER, workspaceId: workspace.id },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert — item keeps its override
      const itemResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: itemQuery, variables: { id: item.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(itemResponse);
      expect(itemResponse.body.data.item.stakeRule).toBe(StakeRule.EQUALLY);
    });

    it('should preserve individual stakes when workspace default changes', async () => {
      // Assume — set individual stakes on item (clears stakeRule)
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const item = await itemFactory.create(workspace.id);
      const memberRecord = await workspaceMemberFactory.create(workspace.id, owner.id);
      const { accessToken } = await authService.authenticateUser(owner);

      await request(app.getHttpServer())
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

      // Act — change workspace default
      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: updateWorkspaceStakeRuleMutation,
          variables: { stakeRule: StakeRule.EQUALLY, workspaceId: workspace.id },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert — item retains individual stakes and null stakeRule
      const itemResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: itemQuery, variables: { id: item.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(itemResponse);
      expect(itemResponse.body.data.item.stakeRule).toBeNull();
      expect(itemResponse.body.data.item.itemStakes).toHaveLength(1);
      expect(itemResponse.body.data.item.itemStakes[0].workspaceMemberId).toBe(memberRecord.id);
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
