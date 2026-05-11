import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { configureApp } from '../src/configure-app';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { ItemStakeModule } from '../src/item-stake/item-stake.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { WorkspaceStakeModule } from '../src/workspace-stake/workspace-stake.module';
import { WorkspaceMembershipModule } from '../src/workspace-membership/workspace-membership.module';
import { WorkspaceModule } from '../src/workspace/workspace.module';
import { FactoryModule } from './factory/factory.module';
import { ItemFactoryService } from './factory/item-factory.service';
import { UserFactoryService } from './factory/user-factory.service';
import { WorkspaceFactoryService } from './factory/workspace-factory.service';
import { WorkspaceMemberFactoryService } from './factory/workspace-member-factory.service';
import { TestGraphqlModule } from './graphql/test-graphql.module';
import { TestConfigModule } from './test-config.module';

const setItemStakesMutation = `
  mutation SetItemStakes($itemId: Int!, $stakes: [MemberStake!]!) {
    setItemStakes(itemId: $itemId, stakes: $stakes) {
      id
      workspaceMemberId
    }
  }
`;

const itemsWithStakesQuery = `
  query Items($workspaceId: Int!) {
    items(workspaceId: $workspaceId) {
      id
      itemStakes {
        id
        workspaceMemberId
      }
    }
  }
`;

describe('ItemStakesByItemIdLoader', () => {
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

  it('should batch itemStake queries for multiple items in a single request', async () => {
    // Assume — workspace with 3 items, each having a stake for the owner member
    const owner = await userFactory.create('active');
    const workspace = await workspaceFactory.create({ ownerId: owner.id });
    const member = await workspaceMemberFactory.create(workspace.id, owner.id);
    const { accessToken } = await authService.authenticateUser(owner);

    const item1 = await itemFactory.create(workspace.id);
    const item2 = await itemFactory.create(workspace.id);
    const item3 = await itemFactory.create(workspace.id);

    const stakes = [{ value: 1.0, workspaceMemberId: member.id }];

    for (const item of [item1, item2, item3]) {
      await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: setItemStakesMutation, variables: { itemId: item.id, stakes } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);
    }

    // Spy before the batched request
    const prismaService = moduleRef.get(PrismaService);
    const findManySpy = jest.spyOn(prismaService.itemStake, 'findMany');

    // Act — single request fetching all items with their stakes
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: itemsWithStakesQuery, variables: { workspaceId: workspace.id } })
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert — dataloader batched all itemId lookups into one DB call
    expect(findManySpy).toHaveBeenCalledTimes(1);

    findManySpy.mockRestore();

    // Assert — response correctness
    expect(response.status).toBe(200);
    expect(response.body?.errors).toBeUndefined();
    const items = response.body.data.items;
    expect(items).toHaveLength(3);

    for (const item of items) {
      expect(item.itemStakes).toHaveLength(1);
      expect(item.itemStakes[0].workspaceMemberId).toBe(member.id);
    }
  });
});
