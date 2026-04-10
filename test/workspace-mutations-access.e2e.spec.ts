import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Permission } from '../generated/prisma/enums';
import { AuthService } from '../src/auth/auth.service';
import { PermissionLevel } from '../src/access/interfaces';
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

  // ─── createWorkspace ──────────────────────────────────────────────────────

  describe('createWorkspace', () => {
    const mutation = `
      mutation CreateWorkspace($dto: WorkspaceInDto!) {
        createWorkspace(dto: $dto) { id }
      }
    `;
    const variables = { dto: { defaultCurrency: 'USD', title: 'Test' } };

    it('should allow a user with OWNER-level WORKSPACE_CREATE permission', async () => {
      const user = await userFactory.createWithPermissions(
        'active',
        [Permission.WORKSPACE_CREATE],
        PermissionLevel.OWNER,
      );
      const { accessToken } = await authService.authenticateUser(user);

      const response = await gql(accessToken)(mutation, variables);

      expectAllowed(response);
    });

    it('should allow a user with ADMIN-level WORKSPACE_CREATE permission', async () => {
      const user = await userFactory.createWithPermissions(
        'active',
        [Permission.WORKSPACE_CREATE],
        PermissionLevel.ADMIN,
      );
      const { accessToken } = await authService.authenticateUser(user);

      const response = await gql(accessToken)(mutation, variables);

      expectAllowed(response);
    });

    it('should deny a user without WORKSPACE_CREATE permission', async () => {
      const user = await userFactory.create('active');
      const { accessToken } = await authService.authenticateUser(user);

      const response = await gql(accessToken)(mutation, variables);

      expectDenied(response);
    });
  });

  // ─── updateWorkspace ──────────────────────────────────────────────────────

  describe('updateWorkspace', () => {
    const mutation = `
      mutation UpdateWorkspace($id: Int!, $dto: WorkspaceInDto!) {
        updateWorkspace(id: $id, dto: $dto) { id }
      }
    `;

    it('should allow the workspace owner with OWNER-level WORKSPACE_UPDATE permission', async () => {
      const owner = await userFactory.createWithPermissions(
        'active',
        [Permission.WORKSPACE_UPDATE],
        PermissionLevel.OWNER,
      );
      const workspace = await workspaceFactory.create(owner.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, {
        dto: { defaultCurrency: 'USD', title: 'Updated' },
        id: workspace.id,
      });

      expectAllowed(response);
    });

    it('should allow a user with ADMIN-level WORKSPACE_UPDATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const admin = await userFactory.createWithPermissions(
        'active',
        [Permission.WORKSPACE_UPDATE],
        PermissionLevel.ADMIN,
      );
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await gql(accessToken)(mutation, {
        dto: { defaultCurrency: 'USD', title: 'Updated' },
        id: workspace.id,
      });

      expectAllowed(response);
    });

    it('should deny the workspace owner without global WORKSPACE_UPDATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, {
        dto: { defaultCurrency: 'USD', title: 'Updated' },
        id: workspace.id,
      });

      expectDenied(response);
    });

    it('should deny a non-owner without permissions', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const other = await userFactory.create('active');
      const { accessToken } = await authService.authenticateUser(other);

      const response = await gql(accessToken)(mutation, {
        dto: { defaultCurrency: 'USD', title: 'Updated' },
        id: workspace.id,
      });

      expectDenied(response);
    });
  });

  // ─── deleteWorkspace ──────────────────────────────────────────────────────

  describe('deleteWorkspace', () => {
    const mutation = `
      mutation DeleteWorkspace($id: Int!) {
        deleteWorkspace(id: $id) { id }
      }
    `;

    it('should allow the workspace owner with OWNER-level WORKSPACE_DELETE permission', async () => {
      const owner = await userFactory.createWithPermissions(
        'active',
        [Permission.WORKSPACE_DELETE],
        PermissionLevel.OWNER,
      );
      const workspace = await workspaceFactory.create(owner.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, { id: workspace.id });

      expectAllowed(response);
    });

    it('should allow a user with ADMIN-level WORKSPACE_DELETE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const admin = await userFactory.createWithPermissions(
        'active',
        [Permission.WORKSPACE_DELETE],
        PermissionLevel.ADMIN,
      );
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await gql(accessToken)(mutation, { id: workspace.id });

      expectAllowed(response);
    });

    it('should deny the workspace owner without global WORKSPACE_DELETE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, { id: workspace.id });

      expectDenied(response);
    });
  });

  // ─── createItem ───────────────────────────────────────────────────────────

  describe('createItem', () => {
    const mutation = `
      mutation CreateItem($workspaceId: Int!, $dto: ItemInDto!) {
        createItem(workspaceId: $workspaceId, dto: $dto) { id }
      }
    `;

    it('should allow the workspace owner with OWNER-level ITEM_CREATE permission', async () => {
      const owner = await userFactory.createWithPermissions(
        'active',
        [Permission.ITEM_CREATE],
        PermissionLevel.OWNER,
      );
      const workspace = await workspaceFactory.create(owner.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, {
        dto: { title: 'Item' },
        workspaceId: workspace.id,
      });

      expectAllowed(response);
    });

    it('should allow a user with ADMIN-level ITEM_CREATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const admin = await userFactory.createWithPermissions(
        'active',
        [Permission.ITEM_CREATE],
        PermissionLevel.ADMIN,
      );
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await gql(accessToken)(mutation, {
        dto: { title: 'Item' },
        workspaceId: workspace.id,
      });

      expectAllowed(response);
    });

    it('should deny the workspace owner without global ITEM_CREATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, {
        dto: { title: 'Item' },
        workspaceId: workspace.id,
      });

      expectDenied(response);
    });

    it('should deny a non-owner without permissions', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const other = await userFactory.createWithPermissions(
        'active',
        [Permission.ITEM_CREATE],
        PermissionLevel.OWNER,
      );
      const { accessToken } = await authService.authenticateUser(other);

      const response = await gql(accessToken)(mutation, {
        dto: { title: 'Item' },
        workspaceId: workspace.id,
      });

      expectDenied(response);
    });
  });

  // ─── updateItem ───────────────────────────────────────────────────────────

  describe('updateItem', () => {
    const mutation = `
      mutation UpdateItem($id: Int!, $dto: ItemInDto!) {
        updateItem(id: $id, dto: $dto) { id }
      }
    `;

    it('should allow the workspace owner with OWNER-level ITEM_UPDATE permission', async () => {
      const owner = await userFactory.createWithPermissions(
        'active',
        [Permission.ITEM_UPDATE],
        PermissionLevel.OWNER,
      );
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, {
        dto: { title: 'Updated' },
        id: item.id,
      });

      expectAllowed(response);
    });

    it('should allow a user with ADMIN-level ITEM_UPDATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const admin = await userFactory.createWithPermissions(
        'active',
        [Permission.ITEM_UPDATE],
        PermissionLevel.ADMIN,
      );
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await gql(accessToken)(mutation, {
        dto: { title: 'Updated' },
        id: item.id,
      });

      expectAllowed(response);
    });

    it('should deny the workspace owner without global ITEM_UPDATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, {
        dto: { title: 'Updated' },
        id: item.id,
      });

      expectDenied(response);
    });
  });

  // ─── deleteItem ───────────────────────────────────────────────────────────

  describe('deleteItem', () => {
    const mutation = `
      mutation DeleteItem($id: Int!) {
        deleteItem(id: $id)
      }
    `;

    it('should allow the workspace owner with OWNER-level ITEM_DELETE permission', async () => {
      const owner = await userFactory.createWithPermissions(
        'active',
        [Permission.ITEM_DELETE],
        PermissionLevel.OWNER,
      );
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, { id: item.id });

      expectAllowed(response);
    });

    it('should allow a user with ADMIN-level ITEM_DELETE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const admin = await userFactory.createWithPermissions(
        'active',
        [Permission.ITEM_DELETE],
        PermissionLevel.ADMIN,
      );
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await gql(accessToken)(mutation, { id: item.id });

      expectAllowed(response);
    });

    it('should deny the workspace owner without global ITEM_DELETE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, { id: item.id });

      expectDenied(response);
    });
  });

  // ─── createTag ────────────────────────────────────────────────────────────

  describe('createTag', () => {
    const mutation = `
      mutation CreateTag($workspaceId: Int!, $dto: TagInDto!) {
        createTag(workspaceId: $workspaceId, dto: $dto) { id }
      }
    `;

    it('should allow the workspace owner with OWNER-level TAG_CREATE permission', async () => {
      const owner = await userFactory.createWithPermissions(
        'active',
        [Permission.TAG_CREATE],
        PermissionLevel.OWNER,
      );
      const workspace = await workspaceFactory.create(owner.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, {
        dto: { color: 'ff0000', title: 'Tag' },
        workspaceId: workspace.id,
      });

      expectAllowed(response);
    });

    it('should allow a user with ADMIN-level TAG_CREATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const admin = await userFactory.createWithPermissions(
        'active',
        [Permission.TAG_CREATE],
        PermissionLevel.ADMIN,
      );
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await gql(accessToken)(mutation, {
        dto: { color: 'ff0000', title: 'Tag' },
        workspaceId: workspace.id,
      });

      expectAllowed(response);
    });

    it('should deny the workspace owner without global TAG_CREATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, {
        dto: { color: 'ff0000', title: 'Tag' },
        workspaceId: workspace.id,
      });

      expectDenied(response);
    });

    it('should deny a non-owner with OWNER-level TAG_CREATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const other = await userFactory.createWithPermissions(
        'active',
        [Permission.TAG_CREATE],
        PermissionLevel.OWNER,
      );
      const { accessToken } = await authService.authenticateUser(other);

      const response = await gql(accessToken)(mutation, {
        dto: { color: 'ff0000', title: 'Tag' },
        workspaceId: workspace.id,
      });

      expectDenied(response);
    });
  });

  // ─── updateTag ────────────────────────────────────────────────────────────

  describe('updateTag', () => {
    const mutation = `
      mutation UpdateTag($id: Int!, $dto: TagInDto!) {
        updateTag(id: $id, dto: $dto) { id }
      }
    `;

    it('should allow the workspace owner with OWNER-level TAG_UPDATE permission', async () => {
      const owner = await userFactory.createWithPermissions(
        'active',
        [Permission.TAG_UPDATE],
        PermissionLevel.OWNER,
      );
      const workspace = await workspaceFactory.create(owner.id);
      const tag = await tagFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, {
        dto: { color: '00ff00', title: 'Updated' },
        id: tag.id,
      });

      expectAllowed(response);
    });

    it('should allow a user with ADMIN-level TAG_UPDATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const tag = await tagFactory.create(workspace.id);
      const admin = await userFactory.createWithPermissions(
        'active',
        [Permission.TAG_UPDATE],
        PermissionLevel.ADMIN,
      );
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await gql(accessToken)(mutation, {
        dto: { color: '00ff00', title: 'Updated' },
        id: tag.id,
      });

      expectAllowed(response);
    });

    it('should deny the workspace owner without global TAG_UPDATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const tag = await tagFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, {
        dto: { color: '00ff00', title: 'Updated' },
        id: tag.id,
      });

      expectDenied(response);
    });
  });

  // ─── deleteTag ────────────────────────────────────────────────────────────

  describe('deleteTag', () => {
    const mutation = `
      mutation DeleteTag($id: Int!) {
        deleteTag(id: $id)
      }
    `;

    it('should allow the workspace owner with OWNER-level TAG_DELETE permission', async () => {
      const owner = await userFactory.createWithPermissions(
        'active',
        [Permission.TAG_DELETE],
        PermissionLevel.OWNER,
      );
      const workspace = await workspaceFactory.create(owner.id);
      const tag = await tagFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, { id: tag.id });

      expectAllowed(response);
    });

    it('should allow a user with ADMIN-level TAG_DELETE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const tag = await tagFactory.create(workspace.id);
      const admin = await userFactory.createWithPermissions(
        'active',
        [Permission.TAG_DELETE],
        PermissionLevel.ADMIN,
      );
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await gql(accessToken)(mutation, { id: tag.id });

      expectAllowed(response);
    });

    it('should deny the workspace owner without global TAG_DELETE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const tag = await tagFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, { id: tag.id });

      expectDenied(response);
    });
  });

  // ─── createPayment ────────────────────────────────────────────────────────

  describe('createPayment', () => {
    const mutation = `
      mutation CreatePayment($itemId: Int!, $dto: PaymentInDto!) {
        createPayment(itemId: $itemId, dto: $dto) { id }
      }
    `;

    it('should allow the workspace owner with OWNER-level PAYMENT_CREATE permission', async () => {
      const owner = await userFactory.createWithPermissions(
        'active',
        [Permission.PAYMENT_CREATE],
        PermissionLevel.OWNER,
      );
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, {
        dto: { cost: '10.00', currency: 'USD', date: '2024-01-01' },
        itemId: item.id,
      });

      expectAllowed(response);
    });

    it('should allow a user with ADMIN-level PAYMENT_CREATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const admin = await userFactory.createWithPermissions(
        'active',
        [Permission.PAYMENT_CREATE],
        PermissionLevel.ADMIN,
      );
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await gql(accessToken)(mutation, {
        dto: { cost: '10.00', currency: 'USD', date: '2024-01-01' },
        itemId: item.id,
      });

      expectAllowed(response);
    });

    it('should deny the workspace owner without global PAYMENT_CREATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, {
        dto: { cost: '10.00', currency: 'USD', date: '2024-01-01' },
        itemId: item.id,
      });

      expectDenied(response);
    });
  });

  // ─── updatePayment ────────────────────────────────────────────────────────

  describe('updatePayment', () => {
    const mutation = `
      mutation UpdatePayment($paymentId: Int!, $dto: PaymentInDto!) {
        updatePayment(paymentId: $paymentId, dto: $dto) { id }
      }
    `;

    it('should allow the workspace owner with OWNER-level PAYMENT_UPDATE permission', async () => {
      const owner = await userFactory.createWithPermissions(
        'active',
        [Permission.PAYMENT_UPDATE],
        PermissionLevel.OWNER,
      );
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, {
        dto: { cost: '20.00', currency: 'EUR', date: '2024-01-01' },
        paymentId: payment.id,
      });

      expectAllowed(response);
    });

    it('should allow a user with ADMIN-level PAYMENT_UPDATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const admin = await userFactory.createWithPermissions(
        'active',
        [Permission.PAYMENT_UPDATE],
        PermissionLevel.ADMIN,
      );
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await gql(accessToken)(mutation, {
        dto: { cost: '20.00', currency: 'EUR', date: '2024-01-01' },
        paymentId: payment.id,
      });

      expectAllowed(response);
    });

    it('should deny the workspace owner without global PAYMENT_UPDATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, {
        dto: { cost: '20.00', currency: 'EUR', date: '2024-01-01' },
        paymentId: payment.id,
      });

      expectDenied(response);
    });
  });

  // ─── deletePayment ────────────────────────────────────────────────────────

  describe('deletePayment', () => {
    const mutation = `
      mutation DeletePayment($paymentId: Int!) {
        deletePayment(paymentId: $paymentId)
      }
    `;

    it('should allow the workspace owner with OWNER-level PAYMENT_DELETE permission', async () => {
      const owner = await userFactory.createWithPermissions(
        'active',
        [Permission.PAYMENT_DELETE],
        PermissionLevel.OWNER,
      );
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, { paymentId: payment.id });

      expectAllowed(response);
    });

    it('should allow a user with ADMIN-level PAYMENT_DELETE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const admin = await userFactory.createWithPermissions(
        'active',
        [Permission.PAYMENT_DELETE],
        PermissionLevel.ADMIN,
      );
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await gql(accessToken)(mutation, { paymentId: payment.id });

      expectAllowed(response);
    });

    it('should deny the workspace owner without global PAYMENT_DELETE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, { paymentId: payment.id });

      expectDenied(response);
    });
  });

  // ─── assignTag ────────────────────────────────────────────────────────────

  describe('assignTag', () => {
    const mutation = `
      mutation AssignTag($dto: AssignTagInDto!) {
        assignTag(dto: $dto) { id }
      }
    `;

    it('should allow the workspace owner with OWNER-level ITEM_TAG_MANAGE permission', async () => {
      const owner = await userFactory.createWithPermissions(
        'active',
        [Permission.ITEM_TAG_MANAGE],
        PermissionLevel.OWNER,
      );
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, {
        dto: { itemId: item.id, tagId: tag.id },
      });

      expectAllowed(response);
    });

    it('should allow a user with ADMIN-level ITEM_TAG_MANAGE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);
      const admin = await userFactory.createWithPermissions(
        'active',
        [Permission.ITEM_TAG_MANAGE],
        PermissionLevel.ADMIN,
      );
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await gql(accessToken)(mutation, {
        dto: { itemId: item.id, tagId: tag.id },
      });

      expectAllowed(response);
    });

    it('should deny the workspace owner without global ITEM_TAG_MANAGE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, {
        dto: { itemId: item.id, tagId: tag.id },
      });

      expectDenied(response);
    });
  });

  // ─── unassignTag ──────────────────────────────────────────────────────────

  describe('unassignTag', () => {
    const mutation = `
      mutation UnassignTag($dto: UnassignTagInDto!) {
        unassignTag(dto: $dto)
      }
    `;

    it('should allow the workspace owner with OWNER-level ITEM_TAG_MANAGE permission', async () => {
      const owner = await userFactory.createWithPermissions(
        'active',
        [Permission.ITEM_TAG_MANAGE],
        PermissionLevel.OWNER,
      );
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);
      await prisma.itemTag.create({ data: { itemId: item.id, tagId: tag.id } });
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, {
        dto: { itemId: item.id, tagId: tag.id },
      });

      expectAllowed(response);
    });

    it('should allow a user with ADMIN-level ITEM_TAG_MANAGE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);
      await prisma.itemTag.create({ data: { itemId: item.id, tagId: tag.id } });
      const admin = await userFactory.createWithPermissions(
        'active',
        [Permission.ITEM_TAG_MANAGE],
        PermissionLevel.ADMIN,
      );
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await gql(accessToken)(mutation, {
        dto: { itemId: item.id, tagId: tag.id },
      });

      expectAllowed(response);
    });

    it('should deny the workspace owner without global ITEM_TAG_MANAGE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);
      await prisma.itemTag.create({ data: { itemId: item.id, tagId: tag.id } });
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, {
        dto: { itemId: item.id, tagId: tag.id },
      });

      expectDenied(response);
    });
  });

  // ─── mergeItems ───────────────────────────────────────────────────────────

  describe('mergeItems', () => {
    const mutation = `
      mutation MergeItems($dto: MergeItemsInDto!) {
        mergeItems(dto: $dto) { id }
      }
    `;

    it('should allow the workspace owner with OWNER-level ITEM_UPDATE permission', async () => {
      const owner = await userFactory.createWithPermissions(
        'active',
        [Permission.ITEM_UPDATE],
        PermissionLevel.OWNER,
      );
      const workspace = await workspaceFactory.create(owner.id);
      const hostItem = await itemFactory.create(workspace.id);
      const mergingItem = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, {
        dto: { hostItemId: hostItem.id, mergingItemId: mergingItem.id },
      });

      expectAllowed(response);
    });

    it('should allow a user with ADMIN-level ITEM_UPDATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const hostItem = await itemFactory.create(workspace.id);
      const mergingItem = await itemFactory.create(workspace.id);
      const admin = await userFactory.createWithPermissions(
        'active',
        [Permission.ITEM_UPDATE],
        PermissionLevel.ADMIN,
      );
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await gql(accessToken)(mutation, {
        dto: { hostItemId: hostItem.id, mergingItemId: mergingItem.id },
      });

      expectAllowed(response);
    });

    it('should deny the workspace owner without global ITEM_UPDATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const hostItem = await itemFactory.create(workspace.id);
      const mergingItem = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, {
        dto: { hostItemId: hostItem.id, mergingItemId: mergingItem.id },
      });

      expectDenied(response);
    });
  });

  // ─── extractAsItem ────────────────────────────────────────────────────────

  describe('extractAsItem', () => {
    const mutation = `
      mutation ExtractAsItem($dto: ExtractAsItemInDto!) {
        extractAsItem(dto: $dto) { id }
      }
    `;

    it('should allow the workspace owner with OWNER-level ITEM_UPDATE permission', async () => {
      const owner = await userFactory.createWithPermissions(
        'active',
        [Permission.ITEM_UPDATE],
        PermissionLevel.OWNER,
      );
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      await paymentFactory.create(item.id); // second payment so extraction is not of all payments
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, {
        dto: { itemId: item.id, paymentIds: [payment.id], title: 'Extracted' },
      });

      expectAllowed(response);
    });

    it('should allow a user with ADMIN-level ITEM_UPDATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      await paymentFactory.create(item.id); // second payment so extraction is not of all payments
      const admin = await userFactory.createWithPermissions(
        'active',
        [Permission.ITEM_UPDATE],
        PermissionLevel.ADMIN,
      );
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await gql(accessToken)(mutation, {
        dto: { itemId: item.id, paymentIds: [payment.id], title: 'Extracted' },
      });

      expectAllowed(response);
    });

    it('should deny the workspace owner without global ITEM_UPDATE permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await gql(accessToken)(mutation, {
        dto: { itemId: item.id, paymentIds: [payment.id], title: 'Extracted' },
      });

      expectDenied(response);
    });
  });
});
