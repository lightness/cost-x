import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { ApplicationErrorCode } from '../src/common/error/coded-application.error';
import { configureApp } from '../src/configure-app';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { ItemModule } from '../src/item/item.module';
import { UserRole } from '../src/user/entity/user-role.enum';
import { FactoryModule } from './factory/factory.module';
import { ItemFactoryService } from './factory/item-factory.service';
import { UserFactoryService } from './factory/user-factory.service';
import { WorkspaceFactoryService } from './factory/workspace-factory.service';
import { TestGraphqlModule } from './graphql/test-graphql.module';
import { TestConfigModule } from './test-config.module';

const itemQuery = `
  query Item($id: Int!) {
    item(id: $id) {
      id
      title
    }
  }
`;

const itemsQuery = `
  query Items($workspaceId: Int!) {
    items(workspaceId: $workspaceId) {
      id
      title
    }
  }
`;

const createItemMutation = `
  mutation CreateItem($workspaceId: Int!, $dto: ItemInDto!) {
    createItem(workspaceId: $workspaceId, dto: $dto) {
      id
      title
    }
  }
`;

const updateItemMutation = `
  mutation UpdateItem($id: Int!, $dto: ItemInDto!) {
    updateItem(id: $id, dto: $dto) {
      id
      title
    }
  }
`;

const deleteItemMutation = `
  mutation DeleteItem($id: Int!) {
    deleteItem(id: $id)
  }
`;

describe('Item E2E', () => {
  let moduleRef: TestingModule;
  let app: NestApplication;
  let authService: AuthService;
  let userFactory: UserFactoryService;
  let workspaceFactory: WorkspaceFactoryService;
  let itemFactory: ItemFactoryService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TestConfigModule, TestGraphqlModule, FactoryModule, ItemModule, GraphqlModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    authService = moduleRef.get(AuthService);
    userFactory = moduleRef.get(UserFactoryService);
    workspaceFactory = moduleRef.get(WorkspaceFactoryService);
    itemFactory = moduleRef.get(ItemFactoryService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('item', () => {
    it('should return item when workspace owner', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create(user.id);
      const item = await itemFactory.create(workspace.id);

      const { accessToken } = await authService.authenticateUser(user);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: itemQuery, variables: { id: item.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.item.id).toBe(item.id);
    });

    it('should not return item when not workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const other = await userFactory.create('active');

      const { accessToken } = await authService.authenticateUser(other);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: itemQuery, variables: { id: item.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not return item when not authenticated', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: itemQuery, variables: { id: item.id } })
        .set('Content-Type', 'application/json');

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should return item when admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });

      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: itemQuery, variables: { id: item.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.item.id).toBe(item.id);
    });
  });

  describe('items', () => {
    it('should return items when workspace owner', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create(user.id);
      await itemFactory.create(workspace.id);

      const { accessToken } = await authService.authenticateUser(user);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: itemsQuery, variables: { workspaceId: workspace.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.items).toHaveLength(1);
    });

    it('should not return items when not workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const other = await userFactory.create('active');

      const { accessToken } = await authService.authenticateUser(other);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: itemsQuery, variables: { workspaceId: workspace.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not return items when not authenticated', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: itemsQuery, variables: { workspaceId: workspace.id } })
        .set('Content-Type', 'application/json');

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should return items when admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      await itemFactory.create(workspace.id);
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });

      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: itemsQuery, variables: { workspaceId: workspace.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.items).toHaveLength(1);
    });
  });

  describe('createItem', () => {
    it('should create item when workspace owner', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create(user.id);

      const { accessToken } = await authService.authenticateUser(user);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: createItemMutation, variables: { workspaceId: workspace.id, dto: { title: 'My Item' } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.createItem.title).toBe('My Item');
    });

    it('should not create item when not workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const other = await userFactory.create('active');

      const { accessToken } = await authService.authenticateUser(other);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: createItemMutation, variables: { workspaceId: workspace.id, dto: { title: 'My Item' } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not create item when not authenticated', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: createItemMutation, variables: { workspaceId: workspace.id, dto: { title: 'My Item' } } })
        .set('Content-Type', 'application/json');

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should create item when admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });

      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: createItemMutation, variables: { workspaceId: workspace.id, dto: { title: 'Admin Item' } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.createItem.title).toBe('Admin Item');
    });
  });

  describe('updateItem', () => {
    it('should update item when workspace owner', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create(user.id);
      const item = await itemFactory.create(workspace.id);

      const { accessToken } = await authService.authenticateUser(user);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updateItemMutation, variables: { id: item.id, dto: { title: 'Updated Item' } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.updateItem.title).toBe('Updated Item');
    });

    it('should not update item when not workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const other = await userFactory.create('active');

      const { accessToken } = await authService.authenticateUser(other);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updateItemMutation, variables: { id: item.id, dto: { title: 'Updated Item' } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not update item when not authenticated', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updateItemMutation, variables: { id: item.id, dto: { title: 'Updated Item' } } })
        .set('Content-Type', 'application/json');

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should update item when admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });

      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updateItemMutation, variables: { id: item.id, dto: { title: 'Admin Updated' } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.updateItem.title).toBe('Admin Updated');
    });
  });

  describe('deleteItem', () => {
    it('should delete item when workspace owner', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create(user.id);
      const item = await itemFactory.create(workspace.id);

      const { accessToken } = await authService.authenticateUser(user);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: deleteItemMutation, variables: { id: item.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.deleteItem).toBe(true);
    });

    it('should not delete item when not workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const other = await userFactory.create('active');

      const { accessToken } = await authService.authenticateUser(other);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: deleteItemMutation, variables: { id: item.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not delete item when not authenticated', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: deleteItemMutation, variables: { id: item.id } })
        .set('Content-Type', 'application/json');

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should delete item when admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });

      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: deleteItemMutation, variables: { id: item.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.deleteItem).toBe(true);
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
