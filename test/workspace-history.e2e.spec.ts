import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { WorkspaceHistoryAction } from '../generated/prisma/client';
import { AuthService } from '../src/auth/auth.service';
import { configureApp } from '../src/configure-app';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { ItemMergeModule } from '../src/item-merge/item-merge.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { WorkspaceHistoryService } from '../src/workspace-history/workspace-history.service';
import { WorkspaceModule } from '../src/workspace/workspace.module';
import { FactoryModule } from './factory/factory.module';
import { ItemFactoryService } from './factory/item-factory.service';
import { PaymentFactoryService } from './factory/payment-factory.service';
import { TagFactoryService } from './factory/tag-factory.service';
import { UserFactoryService } from './factory/user-factory.service';
import { WorkspaceFactoryService } from './factory/workspace-factory.service';
import { TestConfigModule } from './test-config.module';

describe('WorkspaceHistory E2E', () => {
  let moduleRef: TestingModule;
  let app: NestApplication;
  let authService: AuthService;
  let prisma: PrismaService;
  let workspaceHistoryService: WorkspaceHistoryService;
  let userFactory: UserFactoryService;
  let workspaceFactory: WorkspaceFactoryService;
  let itemFactory: ItemFactoryService;
  let paymentFactory: PaymentFactoryService;
  let tagFactory: TagFactoryService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TestConfigModule, FactoryModule, WorkspaceModule, ItemMergeModule, GraphqlModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    authService = moduleRef.get(AuthService);
    prisma = moduleRef.get(PrismaService);
    workspaceHistoryService = moduleRef.get(WorkspaceHistoryService);
    userFactory = moduleRef.get(UserFactoryService);
    workspaceFactory = moduleRef.get(WorkspaceFactoryService);
    itemFactory = moduleRef.get(ItemFactoryService);
    paymentFactory = moduleRef.get(PaymentFactoryService);
    tagFactory = moduleRef.get(TagFactoryService);
  });

  afterAll(async () => {
    await app.close();
  });

  async function getHistory(workspaceId: number) {
    return workspaceHistoryService.listByWorkspaceId(workspaceId);
  }

  function expectSingleHistoryEntry(
    entries: Awaited<ReturnType<typeof getHistory>>,
    action: WorkspaceHistoryAction,
    actorId: number,
  ) {
    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe(action);
    expect(entries[0].actorId).toBe(actorId);
  }

  function gql(app: NestApplication, token: string) {
    return (query: string, variables?: Record<string, unknown>) =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`);
  }

  // ─── Workspace ────────────────────────────────────────────────────────────

  describe('createWorkspace', () => {
    it('should create a WORKSPACE_CREATED history entry', async () => {
      const user = await userFactory.create('active');
      const { accessToken } = await authService.authenticateUser(user);

      const response = await gql(app, accessToken)(
        `mutation CreateWorkspace($dto: WorkspaceInDto!) {
          createWorkspace(dto: $dto) { id }
        }`,
        { dto: { defaultCurrency: 'USD', title: 'My Workspace' } },
      );

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const workspaceId = response.body.data.createWorkspace.id;
      const history = await getHistory(workspaceId);

      expectSingleHistoryEntry(history, WorkspaceHistoryAction.WORKSPACE_CREATED, user.id);
      expect(history[0].newValue).toMatchObject({ title: 'My Workspace' });
      expect(history[0].oldValue).toBeNull();
    });
  });

  describe('updateWorkspace', () => {
    it('should create a WORKSPACE_UPDATED history entry', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: user.id, title: 'Old Title' });
      const { accessToken } = await authService.authenticateUser(user);

      const response = await gql(app, accessToken)(
        `mutation UpdateWorkspace($id: Int!, $dto: WorkspaceInDto!) {
          updateWorkspace(id: $id, dto: $dto) { id }
        }`,
        { dto: { defaultCurrency: 'USD', title: 'New Title' }, id: workspace.id },
      );

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const history = await getHistory(workspace.id);

      expectSingleHistoryEntry(history, WorkspaceHistoryAction.WORKSPACE_UPDATED, user.id);
      expect(history[0].oldValue).toMatchObject({ title: 'Old Title' });
      expect(history[0].newValue).toMatchObject({ title: 'New Title' });
    });
  });

  describe('deleteWorkspace', () => {
    it('should succeed (history is cascade-deleted with workspace)', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: user.id });
      const { accessToken } = await authService.authenticateUser(user);

      const response = await gql(app, accessToken)(
        `mutation DeleteWorkspace($id: Int!) {
          deleteWorkspace(id: $id) { id }
        }`,
        { id: workspace.id },
      );

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
    });
  });

  // ─── Item ──────────────────────────────────────────────────────────────────

  describe('createItem', () => {
    it('should create an ITEM_CREATED history entry', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: user.id });
      const { accessToken } = await authService.authenticateUser(user);

      const response = await gql(app, accessToken)(
        `mutation CreateItem($workspaceId: Int!, $dto: ItemInDto!) {
          createItem(workspaceId: $workspaceId, dto: $dto) { id }
        }`,
        { dto: { title: 'My Item' }, workspaceId: workspace.id },
      );

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const history = await getHistory(workspace.id);

      expectSingleHistoryEntry(history, WorkspaceHistoryAction.ITEM_CREATED, user.id);
      expect(history[0].newValue).toMatchObject({ title: 'My Item' });
      expect(history[0].oldValue).toBeNull();
    });
  });

  describe('updateItem', () => {
    it('should create an ITEM_UPDATED history entry', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: user.id });
      const item = await itemFactory.create(workspace.id, { title: 'Old Title' });
      const { accessToken } = await authService.authenticateUser(user);

      const response = await gql(app, accessToken)(
        `mutation UpdateItem($id: Int!, $dto: ItemInDto!) {
          updateItem(id: $id, dto: $dto) { id }
        }`,
        { dto: { title: 'New Title' }, id: item.id },
      );

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const history = await getHistory(workspace.id);

      expectSingleHistoryEntry(history, WorkspaceHistoryAction.ITEM_UPDATED, user.id);
      expect(history[0].oldValue).toMatchObject({ title: 'Old Title' });
      expect(history[0].newValue).toMatchObject({ title: 'New Title' });
    });
  });

  describe('deleteItem', () => {
    it('should create an ITEM_DELETED history entry', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: user.id });
      const item = await itemFactory.create(workspace.id, { title: 'Doomed Item' });
      const { accessToken } = await authService.authenticateUser(user);

      const response = await gql(app, accessToken)(
        `mutation DeleteItem($id: Int!) {
          deleteItem(id: $id)
        }`,
        { id: item.id },
      );

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const history = await getHistory(workspace.id);

      expectSingleHistoryEntry(history, WorkspaceHistoryAction.ITEM_DELETED, user.id);
      expect(history[0].oldValue).toMatchObject({ title: 'Doomed Item' });
      expect(history[0].newValue).toBeNull();
    });
  });

  // ─── Payment ───────────────────────────────────────────────────────────────

  describe('createPayment', () => {
    it('should create a PAYMENT_CREATED history entry', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: user.id });
      const item = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(user);

      const response = await gql(app, accessToken)(
        `mutation CreatePayment($itemId: Int!, $dto: PaymentInDto!) {
          createPayment(itemId: $itemId, dto: $dto) { id }
        }`,
        { dto: { cost: '25.00', currency: 'USD', date: '2024-06-01' }, itemId: item.id },
      );

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const history = await getHistory(workspace.id);

      expectSingleHistoryEntry(history, WorkspaceHistoryAction.PAYMENT_CREATED, user.id);
      expect(history[0].newValue).toMatchObject({ currency: 'USD' });
      expect(history[0].oldValue).toBeNull();
    });
  });

  describe('updatePayment', () => {
    it('should create a PAYMENT_UPDATED history entry', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: user.id });
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id, { currency: 'USD' });
      const { accessToken } = await authService.authenticateUser(user);

      const response = await gql(app, accessToken)(
        `mutation UpdatePayment($paymentId: Int!, $dto: PaymentInDto!) {
          updatePayment(paymentId: $paymentId, dto: $dto) { id }
        }`,
        { dto: { cost: '50.00', currency: 'EUR', date: '2024-06-01' }, paymentId: payment.id },
      );

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const history = await getHistory(workspace.id);

      expectSingleHistoryEntry(history, WorkspaceHistoryAction.PAYMENT_UPDATED, user.id);
      expect(history[0].oldValue).toMatchObject({ currency: 'USD' });
      expect(history[0].newValue).toMatchObject({ currency: 'EUR' });
    });
  });

  describe('deletePayment', () => {
    it('should create a PAYMENT_DELETED history entry', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: user.id });
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const { accessToken } = await authService.authenticateUser(user);

      const response = await gql(app, accessToken)(
        `mutation DeletePayment($paymentId: Int!) {
          deletePayment(paymentId: $paymentId)
        }`,
        { paymentId: payment.id },
      );

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const history = await getHistory(workspace.id);

      expectSingleHistoryEntry(history, WorkspaceHistoryAction.PAYMENT_DELETED, user.id);
      expect(history[0].oldValue).toMatchObject({ currency: 'USD' });
      expect(history[0].newValue).toBeNull();
    });
  });

  // ─── Tag ───────────────────────────────────────────────────────────────────

  describe('createTag', () => {
    it('should create a TAG_CREATED history entry', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: user.id });
      const { accessToken } = await authService.authenticateUser(user);

      const response = await gql(app, accessToken)(
        `mutation CreateTag($workspaceId: Int!, $dto: TagInDto!) {
          createTag(workspaceId: $workspaceId, dto: $dto) { id }
        }`,
        { dto: { color: 'ff0000', title: 'My Tag' }, workspaceId: workspace.id },
      );

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const history = await getHistory(workspace.id);

      expectSingleHistoryEntry(history, WorkspaceHistoryAction.TAG_CREATED, user.id);
      expect(history[0].newValue).toMatchObject({ color: 'ff0000', title: 'My Tag' });
      expect(history[0].oldValue).toBeNull();
    });
  });

  describe('updateTag', () => {
    it('should create a TAG_UPDATED history entry', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: user.id });
      const tag = await tagFactory.create(workspace.id, { color: 'aaaaaa', title: 'Old Tag' });
      const { accessToken } = await authService.authenticateUser(user);

      const response = await gql(app, accessToken)(
        `mutation UpdateTag($id: Int!, $dto: TagInDto!) {
          updateTag(id: $id, dto: $dto) { id }
        }`,
        { dto: { color: 'bbbbbb', title: 'New Tag' }, id: tag.id },
      );

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const history = await getHistory(workspace.id);

      expectSingleHistoryEntry(history, WorkspaceHistoryAction.TAG_UPDATED, user.id);
      expect(history[0].oldValue).toMatchObject({ color: 'aaaaaa', title: 'Old Tag' });
      expect(history[0].newValue).toMatchObject({ color: 'bbbbbb', title: 'New Tag' });
    });
  });

  describe('deleteTag', () => {
    it('should create a TAG_DELETED history entry', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: user.id });
      const tag = await tagFactory.create(workspace.id, { title: 'Doomed Tag' });
      const { accessToken } = await authService.authenticateUser(user);

      const response = await gql(app, accessToken)(
        `mutation DeleteTag($id: Int!) {
          deleteTag(id: $id)
        }`,
        { id: tag.id },
      );

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const history = await getHistory(workspace.id);

      expectSingleHistoryEntry(history, WorkspaceHistoryAction.TAG_DELETED, user.id);
      expect(history[0].oldValue).toMatchObject({ title: 'Doomed Tag' });
      expect(history[0].newValue).toBeNull();
    });
  });

  // ─── ItemTag ───────────────────────────────────────────────────────────────

  describe('assignTag', () => {
    it('should create an ITEM_TAG_ASSIGNED history entry', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: user.id });
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(user);

      const response = await gql(app, accessToken)(
        `mutation AssignTag($dto: AssignTagInDto!) {
          assignTag(dto: $dto) { id }
        }`,
        { dto: { itemId: item.id, tagId: tag.id } },
      );

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const history = await getHistory(workspace.id);

      expectSingleHistoryEntry(history, WorkspaceHistoryAction.ITEM_TAG_ASSIGNED, user.id);
      expect(history[0].newValue).toMatchObject({ itemId: item.id, tagId: tag.id });
      expect(history[0].oldValue).toBeNull();
    });
  });

  describe('unassignTag', () => {
    it('should create an ITEM_TAG_UNASSIGNED history entry', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: user.id });
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);
      await prisma.itemTag.create({ data: { itemId: item.id, tagId: tag.id } });
      const { accessToken } = await authService.authenticateUser(user);

      const response = await gql(app, accessToken)(
        `mutation UnassignTag($dto: UnassignTagInDto!) {
          unassignTag(dto: $dto)
        }`,
        { dto: { itemId: item.id, tagId: tag.id } },
      );

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const history = await getHistory(workspace.id);

      expectSingleHistoryEntry(history, WorkspaceHistoryAction.ITEM_TAG_UNASSIGNED, user.id);
      expect(history[0].oldValue).toMatchObject({ itemId: item.id, tagId: tag.id });
      expect(history[0].newValue).toBeNull();
    });
  });

  // ─── ItemMerge ─────────────────────────────────────────────────────────────

  describe('mergeItems', () => {
    it('should create an ITEM_MERGED history entry', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: user.id });
      const hostItem = await itemFactory.create(workspace.id, { title: 'Host' });
      const mergingItem = await itemFactory.create(workspace.id, { title: 'Merging' });
      const { accessToken } = await authService.authenticateUser(user);

      const response = await gql(app, accessToken)(
        `mutation MergeItems($dto: MergeItemsInDto!) {
          mergeItems(dto: $dto) { id }
        }`,
        { dto: { hostItemId: hostItem.id, mergingItemId: mergingItem.id } },
      );

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const history = await getHistory(workspace.id);

      expectSingleHistoryEntry(history, WorkspaceHistoryAction.ITEM_MERGED, user.id);
      expect(history[0].oldValue).toMatchObject({
        hostItem: { id: hostItem.id, title: 'Host' },
        mergingItem: { id: mergingItem.id, title: 'Merging' },
      });
      expect(history[0].newValue).toMatchObject({
        hostItem: { id: hostItem.id, title: 'Host' },
        mergingItem: null,
      });
    });
  });
});
