import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { ApplicationErrorCode } from '../src/common/error/coded-application.error';
import { configureApp } from '../src/configure-app';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { ItemExtractModule } from '../src/item-extract/item-extract.module';
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

const extractAsItemMutation = `
  mutation ExtractAsItem($dto: ExtractAsItemInDto!) {
    extractAsItem(dto: $dto) {
      id
      title
      workspaceId
    }
  }
`;

describe('ItemExtract E2E', () => {
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
      imports: [TestConfigModule, TestGraphqlModule, FactoryModule, ItemExtractModule, GraphqlModule],
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

  it('should extract payments as new item when user owns the workspace', async () => {
    // Assume
    const owner = await userFactory.create('active');
    const workspace = await workspaceFactory.create(owner.id);
    const sourceItem = await itemFactory.create(workspace.id);
    const payment1 = await paymentFactory.create(sourceItem.id);
    await paymentFactory.create(sourceItem.id);

    // Act
    const { accessToken } = await authService.authenticateUser(owner);

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: extractAsItemMutation,
        variables: { dto: { itemId: sourceItem.id, paymentIds: [payment1.id], title: 'Extracted' } },
      })
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expectResponseSuccess(response);
    expect(response.body.data.extractAsItem.workspaceId).toBe(workspace.id);

    const movedPayment = await prisma.payment.findUnique({ where: { id: payment1.id } });

    expect(movedPayment.itemId).toBe(response.body.data.extractAsItem.id);
  });

  it('should not extract when request is not authenticated', async () => {
    // Assume
    const owner = await userFactory.create('active');
    const workspace = await workspaceFactory.create(owner.id);
    const sourceItem = await itemFactory.create(workspace.id);
    const payment = await paymentFactory.create(sourceItem.id);

    // Act
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: extractAsItemMutation,
        variables: { dto: { itemId: sourceItem.id, paymentIds: [payment.id], title: 'Extracted' } },
      })
      .set('Content-Type', 'application/json');

    // Assert
    expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
  });

  it('should not extract when non-member', async () => {
    // Assume
    const owner = await userFactory.create('active');
    const stranger = await userFactory.create('active');
    const workspace = await workspaceFactory.create(owner.id);
    const sourceItem = await itemFactory.create(workspace.id);
    const payment = await paymentFactory.create(sourceItem.id);

    // Act
    const { accessToken } = await authService.authenticateUser(stranger);

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: extractAsItemMutation,
        variables: { dto: { itemId: sourceItem.id, paymentIds: [payment.id], title: 'Extracted' } },
      })
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
  });

  it('should extract when workspace member with EXTRACT_ITEM permission', async () => {
    // Assume
    const owner = await userFactory.create('active');
    const workspace = await workspaceFactory.create(owner.id);
    const sourceItem = await itemFactory.create(workspace.id);
    const payment1 = await paymentFactory.create(sourceItem.id);
    await paymentFactory.create(sourceItem.id);
    const member = await userFactory.create('active');
    await workspaceMemberFactory.create(workspace.id, member.id);

    // Act
    const { accessToken } = await authService.authenticateUser(member);

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: extractAsItemMutation,
        variables: { dto: { itemId: sourceItem.id, paymentIds: [payment1.id], title: 'Extracted' } },
      })
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expectResponseSuccess(response);
    expect(response.body.data.extractAsItem.workspaceId).toBe(workspace.id);
  });

  it('should not extract when workspace member without EXTRACT_ITEM permission', async () => {
    // Assume
    const owner = await userFactory.create('active');
    const workspace = await workspaceFactory.create(owner.id);
    const sourceItem = await itemFactory.create(workspace.id);
    const payment = await paymentFactory.create(sourceItem.id);
    const member = await userFactory.create('active');
    await workspaceMemberFactory.create(workspace.id, member.id, { permissions: [] });

    // Act
    const { accessToken } = await authService.authenticateUser(member);

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: extractAsItemMutation,
        variables: { dto: { itemId: sourceItem.id, paymentIds: [payment.id], title: 'Extracted' } },
      })
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
  });

  it('should allow admin to extract from any item', async () => {
    // Assume
    const admin = await userFactory.create('active', { role: UserRole.ADMIN });
    const owner = await userFactory.create('active');
    const workspace = await workspaceFactory.create(owner.id);
    const sourceItem = await itemFactory.create(workspace.id);
    const payment1 = await paymentFactory.create(sourceItem.id);
    await paymentFactory.create(sourceItem.id);

    // Act
    const { accessToken } = await authService.authenticateUser(admin);

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: extractAsItemMutation,
        variables: { dto: { itemId: sourceItem.id, paymentIds: [payment1.id], title: 'Extracted' } },
      })
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expectResponseSuccess(response);
    expect(response.body.data.extractAsItem.workspaceId).toBe(workspace.id);
  });

  it('should not extract when paymentIds is empty', async () => {
    // Assume
    const owner = await userFactory.create('active');
    const workspace = await workspaceFactory.create(owner.id);
    const sourceItem = await itemFactory.create(workspace.id);

    // Act
    const { accessToken } = await authService.authenticateUser(owner);

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: extractAsItemMutation,
        variables: { dto: { itemId: sourceItem.id, paymentIds: [], title: 'Extracted' } },
      })
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expectResponseError(response, { code: ApplicationErrorCode.EXTRACT_PAYMENTS_EMPTY, status: 'BAD_REQUEST' });
  });

  it('should not extract when a payment does not belong to the item', async () => {
    // Assume
    const owner = await userFactory.create('active');
    const workspace = await workspaceFactory.create(owner.id);
    const sourceItem = await itemFactory.create(workspace.id);
    const otherItem = await itemFactory.create(workspace.id);
    await paymentFactory.create(sourceItem.id);
    const foreignPayment = await paymentFactory.create(otherItem.id);

    // Act
    const { accessToken } = await authService.authenticateUser(owner);

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: extractAsItemMutation,
        variables: { dto: { itemId: sourceItem.id, paymentIds: [foreignPayment.id], title: 'Extracted' } },
      })
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expectResponseError(response, { code: ApplicationErrorCode.PAYMENT_NOT_BELONG_TO_ITEM, status: 'BAD_REQUEST' });
  });

  it('should not extract when all payments of the item are selected', async () => {
    // Assume
    const owner = await userFactory.create('active');
    const workspace = await workspaceFactory.create(owner.id);
    const sourceItem = await itemFactory.create(workspace.id);
    const payment1 = await paymentFactory.create(sourceItem.id);
    const payment2 = await paymentFactory.create(sourceItem.id);

    // Act
    const { accessToken } = await authService.authenticateUser(owner);

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: extractAsItemMutation,
        variables: { dto: { itemId: sourceItem.id, paymentIds: [payment1.id, payment2.id], title: 'Extracted' } },
      })
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expectResponseError(response, { code: ApplicationErrorCode.EXTRACT_ALL_PAYMENTS, status: 'BAD_REQUEST' });
  });

  it('should copy source item tags to the extracted item', async () => {
    // Assume
    const owner = await userFactory.create('active');
    const workspace = await workspaceFactory.create(owner.id);
    const sourceItem = await itemFactory.create(workspace.id);
    const tag1 = await tagFactory.create(workspace.id);
    const tag2 = await tagFactory.create(workspace.id);
    await itemTagFactory.create(sourceItem.id, tag1.id);
    await itemTagFactory.create(sourceItem.id, tag2.id);
    const payment1 = await paymentFactory.create(sourceItem.id);
    await paymentFactory.create(sourceItem.id);

    // Act
    const { accessToken } = await authService.authenticateUser(owner);

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: extractAsItemMutation,
        variables: { dto: { itemId: sourceItem.id, paymentIds: [payment1.id], title: 'Extracted' } },
      })
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expectResponseSuccess(response);

    const extractedItemId = response.body.data.extractAsItem.id;

    const extractedTags = await prisma.itemTag.findMany({ where: { itemId: extractedItemId } });
    const sourceTags = await prisma.itemTag.findMany({ where: { itemId: sourceItem.id } });

    const extractedTagIds = extractedTags.map((t) => t.tagId).sort();
    const sourceTagIds = sourceTags.map((t) => t.tagId).sort();

    expect(extractedTagIds).toEqual([tag1.id, tag2.id].sort());
    expect(sourceTagIds).toEqual([tag1.id, tag2.id].sort());
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
