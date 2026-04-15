import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { User, WorkspaceInvite } from '../generated/prisma/client';
import { AuthService } from '../src/auth/auth.service';
import { ApplicationErrorCode } from '../src/common/error/coded-application.error';
import { configureApp } from '../src/configure-app';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { WorkspaceInviteStatus } from '../src/workspace-membership/entity/workspace-invite-status.enum';
import { WorkspaceMembershipModule } from '../src/workspace-membership/workspace-membership.module';
import { WorkspaceModule } from '../src/workspace/workspace.module';
import { WorkspaceInviteFactoryService } from './factory/workspace-invite-factory.service';
import { FactoryModule } from './factory/factory.module';
import { UserFactoryService } from './factory/user-factory.service';
import { WorkspaceFactoryService } from './factory/workspace-factory.service';
import { TestGraphqlModule } from './graphql/test-graphql.module';
import { TestConfigModule } from './test-config.module';

describe('WorkspaceMembership E2E', () => {
  let moduleRef: TestingModule;
  let app: NestApplication;
  let authService: AuthService;
  let prisma: PrismaService;
  let userFactory: UserFactoryService;
  let workspaceFactory: WorkspaceFactoryService;
  let workspaceInviteFactory: WorkspaceInviteFactoryService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TestConfigModule,
        TestGraphqlModule,
        FactoryModule,
        WorkspaceModule,
        WorkspaceMembershipModule,
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
    workspaceInviteFactory = moduleRef.get(WorkspaceInviteFactoryService);
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // createWorkspaceInvite
  // ---------------------------------------------------------------------------

  describe('createWorkspaceInvite', () => {
    const mutation = `
      mutation CreateWorkspaceInvite($dto: CreateWorkspaceInviteInDto!) {
        createWorkspaceInvite(dto: $dto) {
          id
          workspaceId
          inviterId
          inviteeId
          status
        }
      }
    `;

    it('should allow workspace owner to invite a user', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);

      // Act
      const { accessToken } = await authService.authenticateUser(owner);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { dto: { workspaceId: workspace.id, inviteeId: invitee.id } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      const invite = response.body.data.createWorkspaceInvite;
      expect(invite.workspaceId).toBe(workspace.id);
      expect(invite.inviterId).toBe(owner.id);
      expect(invite.inviteeId).toBe(invitee.id);
      expect(invite.status).toBe(WorkspaceInviteStatus.PENDING);

      await expectInvitePending(invite.id);
    });

    it('should not allow non-owner to invite a user', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const nonOwner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);

      // Act
      const { accessToken } = await authService.authenticateUser(nonOwner);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { dto: { workspaceId: workspace.id, inviteeId: invitee.id } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not allow duplicate pending invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      await workspaceInviteFactory.create('pending', { workspaceId: workspace.id, inviterId: owner.id, inviteeId: invitee.id });

      // Act
      const { accessToken } = await authService.authenticateUser(owner);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { dto: { workspaceId: workspace.id, inviteeId: invitee.id } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.WORKSPACE_INVITE_ALREADY_EXISTS,
        status: 'BAD_REQUEST',
      });
    });

    it('should allow re-inviting after a rejected invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      await workspaceInviteFactory.create('rejected', { workspaceId: workspace.id, inviterId: owner.id, inviteeId: invitee.id });

      // Act
      const { accessToken } = await authService.authenticateUser(owner);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { dto: { workspaceId: workspace.id, inviteeId: invitee.id } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInvitePending(response.body.data.createWorkspaceInvite.id);
    });

    it('should not allow inviting an existing active member', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const invite = await workspaceInviteFactory.create('accepted', { workspaceId: workspace.id, inviterId: owner.id, inviteeId: invitee.id });
      await prisma.workspaceMember.create({
        data: {
          workspace: { connect: { id: workspace.id } },
          user: { connect: { id: invitee.id } },
          invite: { connect: { id: invite.id } },
          joinedAt: new Date(),
        },
      });

      // Act
      const { accessToken } = await authService.authenticateUser(owner);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { dto: { workspaceId: workspace.id, inviteeId: invitee.id } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.USER_ALREADY_WORKSPACE_MEMBER,
        status: 'BAD_REQUEST',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // acceptWorkspaceInvite
  // ---------------------------------------------------------------------------

  describe('acceptWorkspaceInvite', () => {
    const mutation = `
      mutation AcceptWorkspaceInvite($inviteId: Int!) {
        acceptWorkspaceInvite(inviteId: $inviteId) {
          id
          status
        }
      }
    `;

    it('should allow invitee to accept a pending invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const invite = await workspaceInviteFactory.create('pending', { workspaceId: workspace.id, inviterId: owner.id, inviteeId: invitee.id });

      // Act
      const { accessToken } = await authService.authenticateUser(invitee);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { inviteId: invite.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInviteAccepted(invite.id);
      await expectActiveMember(workspace.id, invitee.id);
    });

    it('should not allow the workspace owner (inviter) to accept the invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const invite = await workspaceInviteFactory.create('pending', { workspaceId: workspace.id, inviterId: owner.id, inviteeId: invitee.id });

      // Act
      const { accessToken } = await authService.authenticateUser(owner);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { inviteId: invite.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
      await expectInvitePending(invite.id);
    });

    it('should not allow accepting a non-pending invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const invite = await workspaceInviteFactory.create('rejected', { workspaceId: workspace.id, inviterId: owner.id, inviteeId: invitee.id });

      // Act
      const { accessToken } = await authService.authenticateUser(invitee);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { inviteId: invite.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.IMPROPER_WORKSPACE_INVITE_STATUS,
        status: 'BAD_REQUEST',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // rejectWorkspaceInvite
  // ---------------------------------------------------------------------------

  describe('rejectWorkspaceInvite', () => {
    const mutation = `
      mutation RejectWorkspaceInvite($inviteId: Int!) {
        rejectWorkspaceInvite(inviteId: $inviteId) {
          id
          status
        }
      }
    `;

    it('should allow invitee to reject a pending invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const invite = await workspaceInviteFactory.create('pending', { workspaceId: workspace.id, inviterId: owner.id, inviteeId: invitee.id });

      // Act
      const { accessToken } = await authService.authenticateUser(invitee);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { inviteId: invite.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInviteRejected(invite.id);
    });

    it('should not allow the workspace owner (inviter) to reject the invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const invite = await workspaceInviteFactory.create('pending', { workspaceId: workspace.id, inviterId: owner.id, inviteeId: invitee.id });

      // Act
      const { accessToken } = await authService.authenticateUser(owner);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { inviteId: invite.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
      await expectInvitePending(invite.id);
    });

    it('should not allow rejecting a non-pending invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const invite = await workspaceInviteFactory.create('accepted', { workspaceId: workspace.id, inviterId: owner.id, inviteeId: invitee.id });

      // Act
      const { accessToken } = await authService.authenticateUser(invitee);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { inviteId: invite.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.IMPROPER_WORKSPACE_INVITE_STATUS,
        status: 'BAD_REQUEST',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Workspace.members and Workspace.pendingInvites field resolvers
  // ---------------------------------------------------------------------------

  describe('Workspace field resolvers', () => {
    it('should return active members on Workspace.members after accepting an invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const pendingInvite = await workspaceInviteFactory.create('pending', {
        workspaceId: workspace.id,
        inviterId: owner.id,
        inviteeId: invitee.id,
      });

      // Accept the invite so a WorkspaceMember is created
      const { accessToken: inviteeToken } = await authService.authenticateUser(invitee);
      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `mutation { acceptWorkspaceInvite(inviteId: ${pendingInvite.id}) { id } }`,
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${inviteeToken}`);

      // Act — use updateWorkspace mutation (returns Workspace) and select members
      const { accessToken: ownerToken } = await authService.authenticateUser(owner);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              updateWorkspace(id: ${workspace.id}, dto: { title: "${workspace.title}", defaultCurrency: ${workspace.defaultCurrency} }) {
                members {
                  userId
                }
              }
            }
          `,
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${ownerToken}`);

      // Assert
      expectResponseSuccess(response);
      const members = response.body.data.updateWorkspace.members;
      expect(members).toHaveLength(1);
      expect(members[0].userId).toBe(invitee.id);
    });

    it('should return pending invites on Workspace.pendingInvites', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const invite = await workspaceInviteFactory.create('pending', {
        workspaceId: workspace.id,
        inviterId: owner.id,
        inviteeId: invitee.id,
      });

      // Act — use updateWorkspace mutation (returns Workspace) and select pendingInvites
      const { accessToken } = await authService.authenticateUser(owner);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              updateWorkspace(id: ${workspace.id}, dto: { title: "${workspace.title}", defaultCurrency: ${workspace.defaultCurrency} }) {
                pendingInvites {
                  id
                  inviteeId
                  status
                }
              }
            }
          `,
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      const invites = response.body.data.updateWorkspace.pendingInvites;
      expect(invites.some((i: WorkspaceInvite) => i.id === invite.id)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Helpers
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

  async function expectInvitePending(inviteId: number) {
    const invite = await prisma.workspaceInvite.findUnique({ where: { id: inviteId } });
    expect(invite).toBeDefined();
    expect(invite.status).toBe(WorkspaceInviteStatus.PENDING);
    expect(invite.reactedAt).toBeNull();
  }

  async function expectInviteAccepted(inviteId: number) {
    const invite = await prisma.workspaceInvite.findUnique({ where: { id: inviteId } });
    expect(invite).toBeDefined();
    expect(invite.status).toBe(WorkspaceInviteStatus.ACCEPTED);
    expect(invite.reactedAt).toEqual(expect.any(Date));
  }

  async function expectInviteRejected(inviteId: number) {
    const invite = await prisma.workspaceInvite.findUnique({ where: { id: inviteId } });
    expect(invite).toBeDefined();
    expect(invite.status).toBe(WorkspaceInviteStatus.REJECTED);
    expect(invite.reactedAt).toEqual(expect.any(Date));
  }

  async function expectActiveMember(workspaceId: number, userId: number) {
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId, removedAt: null },
    });
    expect(member).toBeDefined();
    expect(member.userId).toBe(userId);
  }
});
