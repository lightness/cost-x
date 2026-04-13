import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { ApplicationErrorCode } from '../src/common/error/coded-application.error';
import { configureApp } from '../src/configure-app';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { TagModule } from '../src/tag/tag.module';
import { UserRole } from '../src/user/entity/user-role.enum';
import { FactoryModule } from './factory/factory.module';
import { TagFactoryService } from './factory/tag-factory.service';
import { UserFactoryService } from './factory/user-factory.service';
import { WorkspaceFactoryService } from './factory/workspace-factory.service';
import { TestGraphqlModule } from './graphql/test-graphql.module';
import { TestConfigModule } from './test-config.module';

const createTagMutation = `
  mutation CreateTag($workspaceId: Int!, $dto: TagInDto!) {
    createTag(workspaceId: $workspaceId, dto: $dto) {
      id
      title
    }
  }
`;

const updateTagMutation = `
  mutation UpdateTag($id: Int!, $dto: TagInDto!) {
    updateTag(id: $id, dto: $dto) {
      id
      title
    }
  }
`;

const deleteTagMutation = `
  mutation DeleteTag($id: Int!) {
    deleteTag(id: $id)
  }
`;

describe('Tag E2E', () => {
  let moduleRef: TestingModule;
  let app: NestApplication;
  let authService: AuthService;
  let userFactory: UserFactoryService;
  let workspaceFactory: WorkspaceFactoryService;
  let tagFactory: TagFactoryService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TestConfigModule, TestGraphqlModule, FactoryModule, TagModule, GraphqlModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    authService = moduleRef.get(AuthService);
    userFactory = moduleRef.get(UserFactoryService);
    workspaceFactory = moduleRef.get(WorkspaceFactoryService);
    tagFactory = moduleRef.get(TagFactoryService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('createTag', () => {
    it('should create tag when workspace owner', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create(user.id);

      const { accessToken } = await authService.authenticateUser(user);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: createTagMutation, variables: { workspaceId: workspace.id, dto: { title: 'My Tag' } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.createTag.title).toBe('My Tag');
    });

    it('should not create tag when not workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const other = await userFactory.create('active');

      const { accessToken } = await authService.authenticateUser(other);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: createTagMutation, variables: { workspaceId: workspace.id, dto: { title: 'My Tag' } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not create tag when not authenticated', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: createTagMutation, variables: { workspaceId: workspace.id, dto: { title: 'My Tag' } } })
        .set('Content-Type', 'application/json');

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should create tag when admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });

      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: createTagMutation, variables: { workspaceId: workspace.id, dto: { title: 'Admin Tag' } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.createTag.title).toBe('Admin Tag');
    });
  });

  describe('updateTag', () => {
    it('should update tag when workspace owner', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create(user.id);
      const tag = await tagFactory.create(workspace.id);

      const { accessToken } = await authService.authenticateUser(user);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updateTagMutation, variables: { id: tag.id, dto: { title: 'Updated Tag' } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.updateTag.title).toBe('Updated Tag');
    });

    it('should not update tag when not workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const tag = await tagFactory.create(workspace.id);
      const other = await userFactory.create('active');

      const { accessToken } = await authService.authenticateUser(other);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updateTagMutation, variables: { id: tag.id, dto: { title: 'Updated Tag' } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not update tag when not authenticated', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const tag = await tagFactory.create(workspace.id);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updateTagMutation, variables: { id: tag.id, dto: { title: 'Updated Tag' } } })
        .set('Content-Type', 'application/json');

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should update tag when admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const tag = await tagFactory.create(workspace.id);
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });

      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updateTagMutation, variables: { id: tag.id, dto: { title: 'Admin Updated' } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.updateTag.title).toBe('Admin Updated');
    });
  });

  describe('deleteTag', () => {
    it('should delete tag when workspace owner', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create(user.id);
      const tag = await tagFactory.create(workspace.id);

      const { accessToken } = await authService.authenticateUser(user);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: deleteTagMutation, variables: { id: tag.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.deleteTag).toBe(true);
    });

    it('should not delete tag when not workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const tag = await tagFactory.create(workspace.id);
      const other = await userFactory.create('active');

      const { accessToken } = await authService.authenticateUser(other);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: deleteTagMutation, variables: { id: tag.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not delete tag when not authenticated', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const tag = await tagFactory.create(workspace.id);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: deleteTagMutation, variables: { id: tag.id } })
        .set('Content-Type', 'application/json');

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should delete tag when admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const tag = await tagFactory.create(workspace.id);
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });

      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: deleteTagMutation, variables: { id: tag.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.deleteTag).toBe(true);
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
