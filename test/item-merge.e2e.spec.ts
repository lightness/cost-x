import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { ApplicationErrorCode } from '../src/common/error/coded-application.error';
import { configureApp } from '../src/configure-app';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { ItemMergeModule } from '../src/item-merge/item-merge.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '../src/user/entity/user-role.enum';
import { FactoryModule } from './factory/factory.module';
import { ItemFactoryService } from './factory/item-factory.service';
import { ItemTagFactoryService } from './factory/item-tag-factory.service';
import { PaymentFactoryService } from './factory/payment-factory.service';
import { TagFactoryService } from './factory/tag-factory.service';
import { UserFactoryService } from './factory/user-factory.service';
import { WorkspaceFactoryService } from './factory/workspace-factory.service';
import { WorkspaceMemberFactoryService } from './factory/workspace-member-factory.service';
import { TestGraphqlModule } from './graphql/test-graphql.module';
import { TestConfigModule } from './test-config.module';

const mergeItemsMutation = `
  mutation MergeItems($dto: MergeItemsInDto!) {
    mergeItems(dto: $dto) {
      id
    }
  }
`;

describe('ItemMerge E2E', () => {
  let moduleRef: TestingModule;
  let app: NestApplication;
  let authService: AuthService;
  let prisma: PrismaService;
  let userFactory: UserFactoryService;
  let workspaceFactory: WorkspaceFactoryService;
  let itemFactory: ItemFactoryService;
  let itemTagFactory: ItemTagFactoryService;
  let paymentFactory: PaymentFactoryService;
  let tagFactory: TagFactoryService;
  let workspaceMemberFactory: WorkspaceMemberFactoryService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TestConfigModule, TestGraphqlModule, FactoryModule, ItemMergeModule, GraphqlModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    authService = moduleRef.get(AuthService);
    prisma = moduleRef.get(PrismaService);
    userFactory = moduleRef.get(UserFactoryService);
    workspaceFactory = moduleRef.get(WorkspaceFactoryService);
    itemFactory = moduleRef.get(ItemFactoryService);
    itemTagFactory = moduleRef.get(ItemTagFactoryService);
    paymentFactory = moduleRef.get(PaymentFactoryService);
    tagFactory = moduleRef.get(TagFactoryService);
    workspaceMemberFactory = moduleRef.get(WorkspaceMemberFactoryService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should merge items when user owns the workspace', async () => {
    // Assume
    const owner = await userFactory.create('active');
    const workspace = await workspaceFactory.create(owner.id);
    const hostItem = await itemFactory.create(workspace.id);
    const mergingItem = await itemFactory.create(workspace.id);

    // Act
    const { accessToken } = await authService.authenticateUser(owner);

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: mergeItemsMutation, variables: { dto: { hostItemId: hostItem.id, mergingItemId: mergingItem.id } } })
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expectResponseSuccess(response);
    expect(response.body.data.mergeItems.id).toBe(hostItem.id);
    await expectItemExists(hostItem.id);
    await expectItemNotExists(mergingItem.id);
  });

  it('should not merge when request is not authenticated', async () => {
    // Assume
    const owner = await userFactory.create('active');
    const workspace = await workspaceFactory.create(owner.id);
    const hostItem = await itemFactory.create(workspace.id);
    const mergingItem = await itemFactory.create(workspace.id);

    // Act
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: mergeItemsMutation, variables: { dto: { hostItemId: hostItem.id, mergingItemId: mergingItem.id } } })
      .set('Content-Type', 'application/json');

    // Assert
    expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
  });

  it('should not merge when non-member', async () => {
    // Assume
    const owner = await userFactory.create('active');
    const stranger = await userFactory.create('active');
    const workspace = await workspaceFactory.create(owner.id);
    const hostItem = await itemFactory.create(workspace.id);
    const mergingItem = await itemFactory.create(workspace.id);

    // Act
    const { accessToken } = await authService.authenticateUser(stranger);

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: mergeItemsMutation, variables: { dto: { hostItemId: hostItem.id, mergingItemId: mergingItem.id } } })
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
  });

  it('should merge items when workspace member with MERGE_ITEMS permission', async () => {
    // Assume
    const owner = await userFactory.create('active');
    const workspace = await workspaceFactory.create(owner.id);
    const hostItem = await itemFactory.create(workspace.id);
    const mergingItem = await itemFactory.create(workspace.id);
    const member = await userFactory.create('active');
    await workspaceMemberFactory.create(workspace.id, member.id);

    // Act
    const { accessToken } = await authService.authenticateUser(member);

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: mergeItemsMutation, variables: { dto: { hostItemId: hostItem.id, mergingItemId: mergingItem.id } } })
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expectResponseSuccess(response);
    expect(response.body.data.mergeItems.id).toBe(hostItem.id);
    await expectItemExists(hostItem.id);
    await expectItemNotExists(mergingItem.id);
  });

  it('should not merge items when workspace member without MERGE_ITEMS permission', async () => {
    // Assume
    const owner = await userFactory.create('active');
    const workspace = await workspaceFactory.create(owner.id);
    const hostItem = await itemFactory.create(workspace.id);
    const mergingItem = await itemFactory.create(workspace.id);
    const member = await userFactory.create('active');
    await workspaceMemberFactory.create(workspace.id, member.id, { permissions: [] });

    // Act
    const { accessToken } = await authService.authenticateUser(member);

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: mergeItemsMutation, variables: { dto: { hostItemId: hostItem.id, mergingItemId: mergingItem.id } } })
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
  });

  it('should allow admin to merge any items', async () => {
    // Assume
    const admin = await userFactory.create('active', { role: UserRole.ADMIN });
    const owner = await userFactory.create('active');
    const workspace = await workspaceFactory.create(owner.id);
    const hostItem = await itemFactory.create(workspace.id);
    const mergingItem = await itemFactory.create(workspace.id);

    // Act
    const { accessToken } = await authService.authenticateUser(admin);

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: mergeItemsMutation, variables: { dto: { hostItemId: hostItem.id, mergingItemId: mergingItem.id } } })
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expectResponseSuccess(response);
    await expectItemExists(hostItem.id);
    await expectItemNotExists(mergingItem.id);
  });

  it('should not merge when items belong to different workspaces', async () => {
    // Assume
    const owner = await userFactory.create('active');
    const workspaceA = await workspaceFactory.create(owner.id);
    const workspaceB = await workspaceFactory.create(owner.id);
    const hostItem = await itemFactory.create(workspaceA.id);
    const mergingItem = await itemFactory.create(workspaceB.id);

    // Act
    const { accessToken } = await authService.authenticateUser(owner);

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: mergeItemsMutation, variables: { dto: { hostItemId: hostItem.id, mergingItemId: mergingItem.id } } })
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expect(response.body?.errors).toBeDefined();
    expect(response.body?.errors?.[0]?.message).toContain(
      `Items #${hostItem.id} and #${mergingItem.id} does not belong to same workspace`,
    );
  });

  it('should move mergingItem payments to hostItem on merge', async () => {
    // Assume
    const owner = await userFactory.create('active');
    const workspace = await workspaceFactory.create(owner.id);
    const hostItem = await itemFactory.create(workspace.id);
    const mergingItem = await itemFactory.create(workspace.id);
    const payment1 = await paymentFactory.create(mergingItem.id);
    const payment2 = await paymentFactory.create(mergingItem.id);

    // Act
    const { accessToken } = await authService.authenticateUser(owner);

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: mergeItemsMutation, variables: { dto: { hostItemId: hostItem.id, mergingItemId: mergingItem.id } } })
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expectResponseSuccess(response);

    const movedPayments = await prisma.payment.findMany({
      where: { id: { in: [payment1.id, payment2.id] } },
    });

    expect(movedPayments).toHaveLength(2);
    expect(movedPayments.every((p) => p.itemId === hostItem.id)).toBe(true);
  });

  it('should delete mergingItem tags on merge', async () => {
    // Assume
    const owner = await userFactory.create('active');
    const workspace = await workspaceFactory.create(owner.id);
    const hostItem = await itemFactory.create(workspace.id);
    const mergingItem = await itemFactory.create(workspace.id);
    const tag = await tagFactory.create(workspace.id);
    await itemTagFactory.create(mergingItem.id, tag.id);

    // Act
    const { accessToken } = await authService.authenticateUser(owner);

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: mergeItemsMutation, variables: { dto: { hostItemId: hostItem.id, mergingItemId: mergingItem.id } } })
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expectResponseSuccess(response);

    const remainingItemTags = await prisma.itemTag.findMany({
      where: { itemId: mergingItem.id },
    });

    expect(remainingItemTags).toHaveLength(0);
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

  async function expectItemExists(itemId: number) {
    const item = await prisma.item.findUnique({ where: { id: itemId } });

    expect(item).toBeDefined();
    expect(item.id).toBe(itemId);
  }

  async function expectItemNotExists(itemId: number) {
    const item = await prisma.item.findUnique({ where: { id: itemId } });

    expect(item).toBeNull();
  }
});
