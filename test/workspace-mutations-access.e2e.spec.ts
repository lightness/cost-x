import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Permission } from '../generated/prisma/enums';
import { AuthService } from '../src/auth/auth.service';
import { ApplicationErrorCode } from '../src/common/error/coded-application.error';
import { configureApp } from '../src/configure-app';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { ItemExtractModule } from '../src/item-extract/item-extract.module';
import { ItemMergeModule } from '../src/item-merge/item-merge.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { WorkspaceModule } from '../src/workspace/workspace.module';
import { FactoryModule } from './factory/factory.module';
import { ItemFactoryService } from './factory/item-factory.service';
import { PaymentFactoryService } from './factory/payment-factory.service';
import { TagFactoryService } from './factory/tag-factory.service';
import { UserFactoryService } from './factory/user-factory.service';
import { WorkspaceFactoryService } from './factory/workspace-factory.service';
import { TestConfigModule } from './test-config.module';

describe('Workspace-Scoped Mutations — Access E2E', () => {
  let moduleRef: TestingModule;
  let app: NestApplication;
  let authService: AuthService;
  let prisma: PrismaService;
  let userFactory: UserFactoryService;
  let workspaceFactory: WorkspaceFactoryService;
  let itemFactory: ItemFactoryService;
  let paymentFactory: PaymentFactoryService;
  let tagFactory: TagFactoryService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TestConfigModule,
        FactoryModule,
        WorkspaceModule,
        ItemMergeModule,
        ItemExtractModule,
        GraphqlModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    authService = moduleRef.get(AuthService);
    prisma = moduleRef.get(PrismaService);
    userFactory = moduleRef.get(UserFactoryService);
    workspaceFactory = moduleRef.get(WorkspaceFactoryService);
    itemFactory = moduleRef.get(ItemFactoryService);
    paymentFactory = moduleRef.get(PaymentFactoryService);
    tagFactory = moduleRef.get(TagFactoryService);
  });

  afterAll(async () => {
    await app.close();
  });

  function gql(token: string) {
    return (query: string, variables?: Record<string, unknown>) =>
      request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`);
  }

  function expectAllowed(response: request.Response) {
    expect(response.status).toBe(200);
    expect(response.body?.errors).toBeUndefined();
  }

  function expectDenied(response: request.Response) {
    expect(response.status).toBe(200);
    expect(response.body?.errors).toBeDefined();
    expect(response.body?.errors?.[0]?.code).toBe(ApplicationErrorCode.NO_ACCESS);
  }

  /** Creates a workspace member with given permissions in the given workspace. */
  async function addMember(userId: number, workspaceId: number, permissions: Permission[]) {
    return prisma.workspaceMember.create({
      data: { permissions, userId, workspaceId },
    });
  }

  /** Global admin: UserPermission records with accessLevel = ADMIN (2) for every requested permission. */
  async function createAdmin(permissions: Permission[]) {
    const admin = await userFactory.create('active');

    await prisma.userPermission.createMany({
      data: permissions.map((permission) => ({ accessLevel: 2, permission, userId: admin.id })),
    });

    return admin;
  }

  // ─── createWorkspace ──────────────────────────────────────────────────────
  // createWorkspace is global (no workspace context), uses UserPermission.

  describe('createWorkspace', () => {
    const mutation = `
      mutation CreateWorkspace($dto: WorkspaceInDto!) {
        createWorkspace(dto: $dto) { id }
      }
    `;
    const variables = { dto: { defaultCurrency: 'USD', title: 'Test' } };

    it('should allow a user with OWNER-level WORKSPACE_CREATE UserPermission', async () => {
      const user = await userFactory.createWithPermissions('active', [Permission.WORKSPACE_CREATE], 1);
      const { accessToken } = await authService.authenticateUser(user);

      expectAllowed(await gql(accessToken)(mutation, variables));
    });

    it('should allow a global admin', async () => {
      const admin = await createAdmin([Permission.WORKSPACE_CREATE]);
      const { accessToken } = await authService.authenticateUser(admin);

      expectAllowed(await gql(accessToken)(mutation, variables));
    });

    it('should deny a user without WORKSPACE_CREATE UserPermission', async () => {
      const user = await userFactory.create('active');
      const { accessToken } = await authService.authenticateUser(user);

      expectDenied(await gql(accessToken)(mutation, variables));
    });
  });

  // ─── updateWorkspace ──────────────────────────────────────────────────────

  describe('updateWorkspace', () => {
    const mutation = `
      mutation UpdateWorkspace($id: Int!, $dto: WorkspaceInDto!) {
        updateWorkspace(id: $id, dto: $dto) { id }
      }
    `;

    it('should allow the workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const { accessToken } = await authService.authenticateUser(owner);

      expectAllowed(await gql(accessToken)(mutation, { dto: { defaultCurrency: 'USD', title: 'Updated' }, id: workspace.id }));
    });

    it('should allow a global admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const admin = await createAdmin([Permission.WORKSPACE_UPDATE]);
      const { accessToken } = await authService.authenticateUser(admin);

      expectAllowed(await gql(accessToken)(mutation, { dto: { defaultCurrency: 'USD', title: 'Updated' }, id: workspace.id }));
    });

    it('should deny a workspace member', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.WORKSPACE_UPDATE]);
      const { accessToken } = await authService.authenticateUser(member);

      expectDenied(await gql(accessToken)(mutation, { dto: { defaultCurrency: 'USD', title: 'Updated' }, id: workspace.id }));
    });

    it('should deny an unrelated user', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const other = await userFactory.create('active');
      const { accessToken } = await authService.authenticateUser(other);

      expectDenied(await gql(accessToken)(mutation, { dto: { defaultCurrency: 'USD', title: 'Updated' }, id: workspace.id }));
    });
  });

  // ─── deleteWorkspace ──────────────────────────────────────────────────────

  describe('deleteWorkspace', () => {
    const mutation = `
      mutation DeleteWorkspace($id: Int!) {
        deleteWorkspace(id: $id) { id }
      }
    `;

    it('should allow the workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const { accessToken } = await authService.authenticateUser(owner);

      expectAllowed(await gql(accessToken)(mutation, { id: workspace.id }));
    });

    it('should allow a global admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const admin = await createAdmin([Permission.WORKSPACE_DELETE]);
      const { accessToken } = await authService.authenticateUser(admin);

      expectAllowed(await gql(accessToken)(mutation, { id: workspace.id }));
    });

    it('should deny a workspace member', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.WORKSPACE_DELETE]);
      const { accessToken } = await authService.authenticateUser(member);

      expectDenied(await gql(accessToken)(mutation, { id: workspace.id }));
    });
  });

  // ─── createItem ───────────────────────────────────────────────────────────

  describe('createItem', () => {
    const mutation = `
      mutation CreateItem($workspaceId: Int!, $dto: ItemInDto!) {
        createItem(workspaceId: $workspaceId, dto: $dto) { id }
      }
    `;

    it('should allow the workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const { accessToken } = await authService.authenticateUser(owner);

      expectAllowed(await gql(accessToken)(mutation, { dto: { title: 'Item' }, workspaceId: workspace.id }));
    });

    it('should allow a workspace member with ITEM_CREATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.ITEM_CREATE]);
      const { accessToken } = await authService.authenticateUser(member);

      expectAllowed(await gql(accessToken)(mutation, { dto: { title: 'Item' }, workspaceId: workspace.id }));
    });

    it('should allow a global admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const admin = await createAdmin([Permission.ITEM_CREATE]);
      const { accessToken } = await authService.authenticateUser(admin);

      expectAllowed(await gql(accessToken)(mutation, { dto: { title: 'Item' }, workspaceId: workspace.id }));
    });

    it('should deny a workspace member without ITEM_CREATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.TAG_CREATE]);
      const { accessToken } = await authService.authenticateUser(member);

      expectDenied(await gql(accessToken)(mutation, { dto: { title: 'Item' }, workspaceId: workspace.id }));
    });

    it('should deny an unrelated user', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const other = await userFactory.create('active');
      const { accessToken } = await authService.authenticateUser(other);

      expectDenied(await gql(accessToken)(mutation, { dto: { title: 'Item' }, workspaceId: workspace.id }));
    });
  });

  // ─── updateItem ───────────────────────────────────────────────────────────

  describe('updateItem', () => {
    const mutation = `
      mutation UpdateItem($id: Int!, $dto: ItemInDto!) {
        updateItem(id: $id, dto: $dto) { id }
      }
    `;

    it('should allow the workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      expectAllowed(await gql(accessToken)(mutation, { dto: { title: 'Updated' }, id: item.id }));
    });

    it('should allow a workspace member with ITEM_UPDATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.ITEM_UPDATE]);
      const { accessToken } = await authService.authenticateUser(member);

      expectAllowed(await gql(accessToken)(mutation, { dto: { title: 'Updated' }, id: item.id }));
    });

    it('should allow a global admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const admin = await createAdmin([Permission.ITEM_UPDATE]);
      const { accessToken } = await authService.authenticateUser(admin);

      expectAllowed(await gql(accessToken)(mutation, { dto: { title: 'Updated' }, id: item.id }));
    });

    it('should deny a workspace member without ITEM_UPDATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.ITEM_READ]);
      const { accessToken } = await authService.authenticateUser(member);

      expectDenied(await gql(accessToken)(mutation, { dto: { title: 'Updated' }, id: item.id }));
    });
  });

  // ─── deleteItem ───────────────────────────────────────────────────────────

  describe('deleteItem', () => {
    const mutation = `
      mutation DeleteItem($id: Int!) {
        deleteItem(id: $id)
      }
    `;

    it('should allow the workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      expectAllowed(await gql(accessToken)(mutation, { id: item.id }));
    });

    it('should allow a workspace member with ITEM_DELETE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.ITEM_DELETE]);
      const { accessToken } = await authService.authenticateUser(member);

      expectAllowed(await gql(accessToken)(mutation, { id: item.id }));
    });

    it('should allow a global admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const admin = await createAdmin([Permission.ITEM_DELETE]);
      const { accessToken } = await authService.authenticateUser(admin);

      expectAllowed(await gql(accessToken)(mutation, { id: item.id }));
    });

    it('should deny a workspace member without ITEM_DELETE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.ITEM_READ]);
      const { accessToken } = await authService.authenticateUser(member);

      expectDenied(await gql(accessToken)(mutation, { id: item.id }));
    });
  });

  // ─── createTag ────────────────────────────────────────────────────────────

  describe('createTag', () => {
    const mutation = `
      mutation CreateTag($workspaceId: Int!, $dto: TagInDto!) {
        createTag(workspaceId: $workspaceId, dto: $dto) { id }
      }
    `;

    it('should allow the workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const { accessToken } = await authService.authenticateUser(owner);

      expectAllowed(await gql(accessToken)(mutation, { dto: { color: 'ff0000', title: 'Tag' }, workspaceId: workspace.id }));
    });

    it('should allow a workspace member with TAG_CREATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.TAG_CREATE]);
      const { accessToken } = await authService.authenticateUser(member);

      expectAllowed(await gql(accessToken)(mutation, { dto: { color: 'ff0000', title: 'Tag' }, workspaceId: workspace.id }));
    });

    it('should allow a global admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const admin = await createAdmin([Permission.TAG_CREATE]);
      const { accessToken } = await authService.authenticateUser(admin);

      expectAllowed(await gql(accessToken)(mutation, { dto: { color: 'ff0000', title: 'Tag' }, workspaceId: workspace.id }));
    });

    it('should deny a workspace member without TAG_CREATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.ITEM_CREATE]);
      const { accessToken } = await authService.authenticateUser(member);

      expectDenied(await gql(accessToken)(mutation, { dto: { color: 'ff0000', title: 'Tag' }, workspaceId: workspace.id }));
    });
  });

  // ─── updateTag ────────────────────────────────────────────────────────────

  describe('updateTag', () => {
    const mutation = `
      mutation UpdateTag($id: Int!, $dto: TagInDto!) {
        updateTag(id: $id, dto: $dto) { id }
      }
    `;

    it('should allow the workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const tag = await tagFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      expectAllowed(await gql(accessToken)(mutation, { dto: { color: '00ff00', title: 'Updated' }, id: tag.id }));
    });

    it('should allow a workspace member with TAG_UPDATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const tag = await tagFactory.create(workspace.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.TAG_UPDATE]);
      const { accessToken } = await authService.authenticateUser(member);

      expectAllowed(await gql(accessToken)(mutation, { dto: { color: '00ff00', title: 'Updated' }, id: tag.id }));
    });

    it('should allow a global admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const tag = await tagFactory.create(workspace.id);
      const admin = await createAdmin([Permission.TAG_UPDATE]);
      const { accessToken } = await authService.authenticateUser(admin);

      expectAllowed(await gql(accessToken)(mutation, { dto: { color: '00ff00', title: 'Updated' }, id: tag.id }));
    });

    it('should deny a workspace member without TAG_UPDATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const tag = await tagFactory.create(workspace.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.TAG_CREATE]);
      const { accessToken } = await authService.authenticateUser(member);

      expectDenied(await gql(accessToken)(mutation, { dto: { color: '00ff00', title: 'Updated' }, id: tag.id }));
    });
  });

  // ─── deleteTag ────────────────────────────────────────────────────────────

  describe('deleteTag', () => {
    const mutation = `
      mutation DeleteTag($id: Int!) {
        deleteTag(id: $id)
      }
    `;

    it('should allow the workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const tag = await tagFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      expectAllowed(await gql(accessToken)(mutation, { id: tag.id }));
    });

    it('should allow a workspace member with TAG_DELETE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const tag = await tagFactory.create(workspace.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.TAG_DELETE]);
      const { accessToken } = await authService.authenticateUser(member);

      expectAllowed(await gql(accessToken)(mutation, { id: tag.id }));
    });

    it('should allow a global admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const tag = await tagFactory.create(workspace.id);
      const admin = await createAdmin([Permission.TAG_DELETE]);
      const { accessToken } = await authService.authenticateUser(admin);

      expectAllowed(await gql(accessToken)(mutation, { id: tag.id }));
    });

    it('should deny a workspace member without TAG_DELETE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const tag = await tagFactory.create(workspace.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.TAG_CREATE]);
      const { accessToken } = await authService.authenticateUser(member);

      expectDenied(await gql(accessToken)(mutation, { id: tag.id }));
    });
  });

  // ─── createPayment ────────────────────────────────────────────────────────

  describe('createPayment', () => {
    const mutation = `
      mutation CreatePayment($itemId: Int!, $dto: PaymentInDto!) {
        createPayment(itemId: $itemId, dto: $dto) { id }
      }
    `;

    it('should allow the workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      expectAllowed(await gql(accessToken)(mutation, { dto: { cost: '10.00', currency: 'USD', date: '2024-01-01' }, itemId: item.id }));
    });

    it('should allow a workspace member with PAYMENT_CREATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.PAYMENT_CREATE]);
      const { accessToken } = await authService.authenticateUser(member);

      expectAllowed(await gql(accessToken)(mutation, { dto: { cost: '10.00', currency: 'USD', date: '2024-01-01' }, itemId: item.id }));
    });

    it('should allow a global admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const admin = await createAdmin([Permission.PAYMENT_CREATE]);
      const { accessToken } = await authService.authenticateUser(admin);

      expectAllowed(await gql(accessToken)(mutation, { dto: { cost: '10.00', currency: 'USD', date: '2024-01-01' }, itemId: item.id }));
    });

    it('should deny a workspace member without PAYMENT_CREATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.PAYMENT_READ]);
      const { accessToken } = await authService.authenticateUser(member);

      expectDenied(await gql(accessToken)(mutation, { dto: { cost: '10.00', currency: 'USD', date: '2024-01-01' }, itemId: item.id }));
    });
  });

  // ─── updatePayment ────────────────────────────────────────────────────────

  describe('updatePayment', () => {
    const mutation = `
      mutation UpdatePayment($paymentId: Int!, $dto: PaymentInDto!) {
        updatePayment(paymentId: $paymentId, dto: $dto) { id }
      }
    `;

    it('should allow the workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const { accessToken } = await authService.authenticateUser(owner);

      expectAllowed(await gql(accessToken)(mutation, { dto: { cost: '20.00', currency: 'EUR', date: '2024-01-01' }, paymentId: payment.id }));
    });

    it('should allow a workspace member with PAYMENT_UPDATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.PAYMENT_UPDATE]);
      const { accessToken } = await authService.authenticateUser(member);

      expectAllowed(await gql(accessToken)(mutation, { dto: { cost: '20.00', currency: 'EUR', date: '2024-01-01' }, paymentId: payment.id }));
    });

    it('should allow a global admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const admin = await createAdmin([Permission.PAYMENT_UPDATE]);
      const { accessToken } = await authService.authenticateUser(admin);

      expectAllowed(await gql(accessToken)(mutation, { dto: { cost: '20.00', currency: 'EUR', date: '2024-01-01' }, paymentId: payment.id }));
    });

    it('should deny a workspace member without PAYMENT_UPDATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.PAYMENT_READ]);
      const { accessToken } = await authService.authenticateUser(member);

      expectDenied(await gql(accessToken)(mutation, { dto: { cost: '20.00', currency: 'EUR', date: '2024-01-01' }, paymentId: payment.id }));
    });
  });

  // ─── deletePayment ────────────────────────────────────────────────────────

  describe('deletePayment', () => {
    const mutation = `
      mutation DeletePayment($paymentId: Int!) {
        deletePayment(paymentId: $paymentId)
      }
    `;

    it('should allow the workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const { accessToken } = await authService.authenticateUser(owner);

      expectAllowed(await gql(accessToken)(mutation, { paymentId: payment.id }));
    });

    it('should allow a workspace member with PAYMENT_DELETE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.PAYMENT_DELETE]);
      const { accessToken } = await authService.authenticateUser(member);

      expectAllowed(await gql(accessToken)(mutation, { paymentId: payment.id }));
    });

    it('should allow a global admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const admin = await createAdmin([Permission.PAYMENT_DELETE]);
      const { accessToken } = await authService.authenticateUser(admin);

      expectAllowed(await gql(accessToken)(mutation, { paymentId: payment.id }));
    });

    it('should deny a workspace member without PAYMENT_DELETE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.PAYMENT_READ]);
      const { accessToken } = await authService.authenticateUser(member);

      expectDenied(await gql(accessToken)(mutation, { paymentId: payment.id }));
    });
  });

  // ─── assignTag ────────────────────────────────────────────────────────────

  describe('assignTag', () => {
    const mutation = `
      mutation AssignTag($dto: AssignTagInDto!) {
        assignTag(dto: $dto) { id }
      }
    `;

    it('should allow the workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      expectAllowed(await gql(accessToken)(mutation, { dto: { itemId: item.id, tagId: tag.id } }));
    });

    it('should allow a workspace member with ITEM_TAG_MANAGE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.ITEM_TAG_MANAGE]);
      const { accessToken } = await authService.authenticateUser(member);

      expectAllowed(await gql(accessToken)(mutation, { dto: { itemId: item.id, tagId: tag.id } }));
    });

    it('should allow a global admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);
      const admin = await createAdmin([Permission.ITEM_TAG_MANAGE]);
      const { accessToken } = await authService.authenticateUser(admin);

      expectAllowed(await gql(accessToken)(mutation, { dto: { itemId: item.id, tagId: tag.id } }));
    });

    it('should deny a workspace member without ITEM_TAG_MANAGE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.ITEM_READ]);
      const { accessToken } = await authService.authenticateUser(member);

      expectDenied(await gql(accessToken)(mutation, { dto: { itemId: item.id, tagId: tag.id } }));
    });
  });

  // ─── unassignTag ──────────────────────────────────────────────────────────

  describe('unassignTag', () => {
    const mutation = `
      mutation UnassignTag($dto: UnassignTagInDto!) {
        unassignTag(dto: $dto)
      }
    `;

    it('should allow the workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);
      await prisma.itemTag.create({ data: { itemId: item.id, tagId: tag.id } });
      const { accessToken } = await authService.authenticateUser(owner);

      expectAllowed(await gql(accessToken)(mutation, { dto: { itemId: item.id, tagId: tag.id } }));
    });

    it('should allow a workspace member with ITEM_TAG_MANAGE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);
      await prisma.itemTag.create({ data: { itemId: item.id, tagId: tag.id } });
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.ITEM_TAG_MANAGE]);
      const { accessToken } = await authService.authenticateUser(member);

      expectAllowed(await gql(accessToken)(mutation, { dto: { itemId: item.id, tagId: tag.id } }));
    });

    it('should allow a global admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);
      await prisma.itemTag.create({ data: { itemId: item.id, tagId: tag.id } });
      const admin = await createAdmin([Permission.ITEM_TAG_MANAGE]);
      const { accessToken } = await authService.authenticateUser(admin);

      expectAllowed(await gql(accessToken)(mutation, { dto: { itemId: item.id, tagId: tag.id } }));
    });

    it('should deny a workspace member without ITEM_TAG_MANAGE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);
      await prisma.itemTag.create({ data: { itemId: item.id, tagId: tag.id } });
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.ITEM_READ]);
      const { accessToken } = await authService.authenticateUser(member);

      expectDenied(await gql(accessToken)(mutation, { dto: { itemId: item.id, tagId: tag.id } }));
    });
  });

  // ─── mergeItems ───────────────────────────────────────────────────────────

  describe('mergeItems', () => {
    const mutation = `
      mutation MergeItems($dto: MergeItemsInDto!) {
        mergeItems(dto: $dto) { id }
      }
    `;

    it('should allow the workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const hostItem = await itemFactory.create(workspace.id);
      const mergingItem = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      expectAllowed(await gql(accessToken)(mutation, { dto: { hostItemId: hostItem.id, mergingItemId: mergingItem.id } }));
    });

    it('should allow a workspace member with ITEM_UPDATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const hostItem = await itemFactory.create(workspace.id);
      const mergingItem = await itemFactory.create(workspace.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.ITEM_UPDATE]);
      const { accessToken } = await authService.authenticateUser(member);

      expectAllowed(await gql(accessToken)(mutation, { dto: { hostItemId: hostItem.id, mergingItemId: mergingItem.id } }));
    });

    it('should allow a global admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const hostItem = await itemFactory.create(workspace.id);
      const mergingItem = await itemFactory.create(workspace.id);
      const admin = await createAdmin([Permission.ITEM_UPDATE]);
      const { accessToken } = await authService.authenticateUser(admin);

      expectAllowed(await gql(accessToken)(mutation, { dto: { hostItemId: hostItem.id, mergingItemId: mergingItem.id } }));
    });

    it('should deny a workspace member without ITEM_UPDATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const hostItem = await itemFactory.create(workspace.id);
      const mergingItem = await itemFactory.create(workspace.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.ITEM_READ]);
      const { accessToken } = await authService.authenticateUser(member);

      expectDenied(await gql(accessToken)(mutation, { dto: { hostItemId: hostItem.id, mergingItemId: mergingItem.id } }));
    });
  });

  // ─── extractAsItem ────────────────────────────────────────────────────────

  describe('extractAsItem', () => {
    const mutation = `
      mutation ExtractAsItem($dto: ExtractAsItemInDto!) {
        extractAsItem(dto: $dto) { id }
      }
    `;

    it('should allow the workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      await paymentFactory.create(item.id);
      const { accessToken } = await authService.authenticateUser(owner);

      expectAllowed(await gql(accessToken)(mutation, { dto: { itemId: item.id, paymentIds: [payment.id], title: 'Extracted' } }));
    });

    it('should allow a workspace member with ITEM_UPDATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      await paymentFactory.create(item.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.ITEM_UPDATE]);
      const { accessToken } = await authService.authenticateUser(member);

      expectAllowed(await gql(accessToken)(mutation, { dto: { itemId: item.id, paymentIds: [payment.id], title: 'Extracted' } }));
    });

    it('should allow a global admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      await paymentFactory.create(item.id);
      const admin = await createAdmin([Permission.ITEM_UPDATE]);
      const { accessToken } = await authService.authenticateUser(admin);

      expectAllowed(await gql(accessToken)(mutation, { dto: { itemId: item.id, paymentIds: [payment.id], title: 'Extracted' } }));
    });

    it('should deny a workspace member without ITEM_UPDATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const member = await userFactory.create('active');
      await addMember(member.id, workspace.id, [Permission.ITEM_READ]);
      const { accessToken } = await authService.authenticateUser(member);

      expectDenied(await gql(accessToken)(mutation, { dto: { itemId: item.id, paymentIds: [payment.id], title: 'Extracted' } }));
    });
  });
});
