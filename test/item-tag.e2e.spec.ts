import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { ApplicationErrorCode } from '../src/common/error/coded-application.error';
import { configureApp } from '../src/configure-app';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { ItemTagModule } from '../src/item-tag/item-tag.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '../src/user/entity/user-role.enum';
import { FactoryModule } from './factory/factory.module';
import { ItemFactoryService } from './factory/item-factory.service';
import { TagFactoryService } from './factory/tag-factory.service';
import { UserFactoryService } from './factory/user-factory.service';
import { WorkspaceFactoryService } from './factory/workspace-factory.service';
import { TestGraphqlModule } from './graphql/test-graphql.module';
import { TestConfigModule } from './test-config.module';

const assignTagMutation = `
  mutation AssignTag($dto: AssignTagInDto!) {
    assignTag(dto: $dto) {
      id
      itemId
      tagId
    }
  }
`;

const unassignTagMutation = `
  mutation UnassignTag($dto: UnassignTagInDto!) {
    unassignTag(dto: $dto)
  }
`;

describe('ItemTag E2E', () => {
  let moduleRef: TestingModule;
  let app: NestApplication;
  let authService: AuthService;
  let prisma: PrismaService;
  let userFactory: UserFactoryService;
  let workspaceFactory: WorkspaceFactoryService;
  let itemFactory: ItemFactoryService;
  let tagFactory: TagFactoryService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TestConfigModule, TestGraphqlModule, FactoryModule, ItemTagModule, GraphqlModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    authService = moduleRef.get(AuthService);
    prisma = moduleRef.get(PrismaService);
    userFactory = moduleRef.get(UserFactoryService);
    workspaceFactory = moduleRef.get(WorkspaceFactoryService);
    itemFactory = moduleRef.get(ItemFactoryService);
    tagFactory = moduleRef.get(TagFactoryService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('assignTag', () => {
    it('should assign tag to item when user owns the workspace', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);

      // Act
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: assignTagMutation, variables: { dto: { itemId: item.id, tagId: tag.id } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      expect(response.body.data.assignTag.itemId).toBe(item.id);
      expect(response.body.data.assignTag.tagId).toBe(tag.id);
      await expectItemTagExists(item.id, tag.id);
    });

    it('should not assign tag when request is not authenticated', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);

      // Act
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: assignTagMutation, variables: { dto: { itemId: item.id, tagId: tag.id } } })
        .set('Content-Type', 'application/json');

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not assign tag when user is not a workspace owner', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const stranger = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);

      // Act
      const { accessToken } = await authService.authenticateUser(stranger);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: assignTagMutation, variables: { dto: { itemId: item.id, tagId: tag.id } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should allow admin to assign tag to any item', async () => {
      // Assume
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);

      // Act
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: assignTagMutation, variables: { dto: { itemId: item.id, tagId: tag.id } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectItemTagExists(item.id, tag.id);
    });

    it('should not assign tag when item already has the tag', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);
      await prisma.itemTag.create({ data: { itemId: item.id, tagId: tag.id } });

      // Act
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: assignTagMutation, variables: { dto: { itemId: item.id, tagId: tag.id } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.body?.errors).toBeDefined();
      expect(response.body?.errors?.[0]?.message).toContain(`Item #${item.id} already has tag #${tag.id}`);
    });

    it('should not assign tag when item and tag belong to different workspaces', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const workspaceA = await workspaceFactory.create(owner.id);
      const workspaceB = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspaceA.id);
      const tag = await tagFactory.create(workspaceB.id);

      // Act
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: assignTagMutation, variables: { dto: { itemId: item.id, tagId: tag.id } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.body?.errors).toBeDefined();
      expect(response.body?.errors?.[0]?.message).toContain(
        `Item #${item.id} and tag #${tag.id} does not belong to same workspace`,
      );
    });
  });

  describe('unassignTag', () => {
    it('should unassign tag from item when user owns the workspace', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);
      await prisma.itemTag.create({ data: { itemId: item.id, tagId: tag.id } });

      // Act
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: unassignTagMutation, variables: { dto: { itemId: item.id, tagId: tag.id } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      expect(response.body.data.unassignTag).toBe(true);
      await expectItemTagNotExists(item.id, tag.id);
    });

    it('should not unassign tag when request is not authenticated', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);

      // Act
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: unassignTagMutation, variables: { dto: { itemId: item.id, tagId: tag.id } } })
        .set('Content-Type', 'application/json');

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not unassign tag when user is not a workspace owner', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const stranger = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);
      await prisma.itemTag.create({ data: { itemId: item.id, tagId: tag.id } });

      // Act
      const { accessToken } = await authService.authenticateUser(stranger);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: unassignTagMutation, variables: { dto: { itemId: item.id, tagId: tag.id } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should allow admin to unassign tag from any item', async () => {
      // Assume
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);
      await prisma.itemTag.create({ data: { itemId: item.id, tagId: tag.id } });

      // Act
      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: unassignTagMutation, variables: { dto: { itemId: item.id, tagId: tag.id } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectItemTagNotExists(item.id, tag.id);
    });

    it('should not unassign tag when item does not have the tag', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const tag = await tagFactory.create(workspace.id);

      // Act
      const { accessToken } = await authService.authenticateUser(owner);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: unassignTagMutation, variables: { dto: { itemId: item.id, tagId: tag.id } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.body?.errors).toBeDefined();
      expect(response.body?.errors?.[0]?.message).toContain(`Item #${item.id} does not have tag #${tag.id}`);
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

  async function expectItemTagExists(itemId: number, tagId: number) {
    const itemTag = await prisma.itemTag.findUnique({
      where: { itemId_tagId: { itemId, tagId } },
    });

    expect(itemTag).toBeDefined();
    expect(itemTag.itemId).toBe(itemId);
    expect(itemTag.tagId).toBe(tagId);
  }

  async function expectItemTagNotExists(itemId: number, tagId: number) {
    const itemTag = await prisma.itemTag.findUnique({
      where: { itemId_tagId: { itemId, tagId } },
    });

    expect(itemTag).toBeNull();
  }
});
