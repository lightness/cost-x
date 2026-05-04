import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { WorkspaceInvite, WorkspacePermission } from '../generated/prisma/client';
import { AuthService } from '../src/auth/auth.service';
import { ApplicationErrorCode } from '../src/common/error/coded-application.error';
import { configureApp } from '../src/configure-app';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '../src/user/entity/user-role.enum';
import { WorkspaceInviteStatus } from '../src/workspace-membership/entity/workspace-invite-status.enum';
import { WorkspaceMembershipModule } from '../src/workspace-membership/workspace-membership.module';
import { WorkspaceModule } from '../src/workspace/workspace.module';
import { FactoryModule } from './factory/factory.module';
import { UserFactoryService } from './factory/user-factory.service';
import { WorkspaceFactoryService } from './factory/workspace-factory.service';
import { WorkspaceInviteFactoryService } from './factory/workspace-invite-factory.service';
import { WorkspaceMemberFactoryService } from './factory/workspace-member-factory.service';
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
  let workspaceMemberFactory: WorkspaceMemberFactoryService;

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
    workspaceMemberFactory = moduleRef.get(WorkspaceMemberFactoryService);
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
      const workspace = await workspaceFactory.create({ ownerId: owner.id });

      // Act
      const { accessToken } = await authService.authenticateUser(owner);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            dto: { inviteeId: invitee.id, inviterId: owner.id, workspaceId: workspace.id },
          },
        })
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

    it('should not allow non-member to invite a user', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const nonMember = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });

      // Act
      const { accessToken } = await authService.authenticateUser(nonMember);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            dto: { inviteeId: invitee.id, inviterId: nonMember.id, workspaceId: workspace.id },
          },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should allow workspace member with CREATE_WORKSPACE_INVITE permission to invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const member = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      await workspaceMemberFactory.create(workspace.id, member.id);

      // Act
      const { accessToken } = await authService.authenticateUser(member);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            dto: { inviteeId: invitee.id, inviterId: member.id, workspaceId: workspace.id },
          },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInvitePending(response.body.data.createWorkspaceInvite.id);
    });

    it('should not allow workspace member without CREATE_WORKSPACE_INVITE permission to invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const member = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      await workspaceMemberFactory.create(workspace.id, member.id, {
        permissions: Object.values(WorkspacePermission).filter(
          (p) => p !== WorkspacePermission.CREATE_WORKSPACE_INVITE,
        ),
      });

      // Act
      const { accessToken } = await authService.authenticateUser(member);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            dto: { inviteeId: invitee.id, inviterId: member.id, workspaceId: workspace.id },
          },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not allow user to invite on behalf of another user', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const otherUser = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });

      // Act — owner authenticates but sets inviterId to otherUser
      const { accessToken } = await authService.authenticateUser(owner);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            dto: { inviteeId: invitee.id, inviterId: otherUser.id, workspaceId: workspace.id },
          },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should allow admin to invite on behalf of workspace owner', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });

      // Act
      const { accessToken } = await authService.authenticateUser(admin);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            dto: { inviteeId: invitee.id, inviterId: owner.id, workspaceId: workspace.id },
          },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      const invite = response.body.data.createWorkspaceInvite;
      expect(invite.inviterId).toBe(owner.id);
      await expectInvitePending(invite.id);
    });

    it('should not allow duplicate pending invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      await workspaceInviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
      });

      // Act
      const { accessToken } = await authService.authenticateUser(owner);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            dto: { inviteeId: invitee.id, inviterId: owner.id, workspaceId: workspace.id },
          },
        })
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
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      await workspaceInviteFactory.create('rejected', {
        inviteeId: invitee.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
      });

      // Act
      const { accessToken } = await authService.authenticateUser(owner);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            dto: { inviteeId: invitee.id, inviterId: owner.id, workspaceId: workspace.id },
          },
        })
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
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const invite = await workspaceInviteFactory.create('accepted', {
        inviteeId: invitee.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
      });
      await prisma.workspaceMember.create({
        data: {
          invite: { connect: { id: invite.id } },
          joinedAt: new Date(),
          user: { connect: { id: invitee.id } },
          workspace: { connect: { id: workspace.id } },
        },
      });

      // Act
      const { accessToken } = await authService.authenticateUser(owner);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            dto: { inviteeId: invitee.id, inviterId: owner.id, workspaceId: workspace.id },
          },
        })
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
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const invite = await workspaceInviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
      });

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

    it('should allow admin to accept any pending invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const invite = await workspaceInviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
      });

      // Act
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const { accessToken } = await authService.authenticateUser(admin);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { inviteId: invite.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInviteAccepted(invite.id);
    });

    it('should not allow the workspace owner (inviter) to accept the invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const invite = await workspaceInviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
      });

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
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const invite = await workspaceInviteFactory.create('rejected', {
        inviteeId: invitee.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
      });

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

    it('should not allow accepting a cancelled invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const invite = await workspaceInviteFactory.create('cancelled', {
        inviteeId: invitee.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
      });

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

    it('should allow only one of two concurrent accepts to succeed', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const invite = await workspaceInviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
      });

      // Act — fire two accepts concurrently with the same token
      const { accessToken } = await authService.authenticateUser(invitee);
      const send = () =>
        request(app.getHttpServer())
          .post('/graphql')
          .send({ query: mutation, variables: { inviteId: invite.id } })
          .set('Content-Type', 'application/json')
          .set('Authorization', `Bearer ${accessToken}`);

      const [response1, response2] = await Promise.all([send(), send()]);

      // Assert — exactly one request won
      const responses = [response1, response2];
      const successes = responses.filter((r) => r.status === 200 && !r.body.errors);
      expect(successes).toHaveLength(1);

      // Assert — exactly one member row exists (no duplicate)
      const members = await prisma.workspaceMember.findMany({
        where: { userId: invitee.id, workspaceId: workspace.id },
      });
      expect(members).toHaveLength(1);

      // Assert — invite reached a terminal accepted state
      await expectInviteAccepted(invite.id);
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
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const invite = await workspaceInviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
      });

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

    it('should allow admin to reject any pending invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const invite = await workspaceInviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
      });

      // Act
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const { accessToken } = await authService.authenticateUser(admin);
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
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const invite = await workspaceInviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
      });

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
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const invite = await workspaceInviteFactory.create('accepted', {
        inviteeId: invitee.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
      });

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

    it('should not allow rejecting a cancelled invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const invite = await workspaceInviteFactory.create('cancelled', {
        inviteeId: invitee.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
      });

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
  // cancelWorkspaceInvite
  // ---------------------------------------------------------------------------

  describe('cancelWorkspaceInvite', () => {
    const mutation = `
      mutation CancelWorkspaceInvite($inviteId: Int!) {
        cancelWorkspaceInvite(inviteId: $inviteId) {
          id
          status
        }
      }
    `;

    it('should allow workspace owner to cancel a pending invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const invite = await workspaceInviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
      });

      // Act
      const { accessToken } = await authService.authenticateUser(owner);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { inviteId: invite.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInviteCancelled(invite.id);
    });

    it('should allow inviter to cancel a pending invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      await workspaceMemberFactory.create(workspace.id, inviter.id);
      const invite = await workspaceInviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
        workspaceId: workspace.id,
      });

      // Act
      const { accessToken } = await authService.authenticateUser(inviter);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { inviteId: invite.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInviteCancelled(invite.id);
    });

    it('should allow admin to cancel any pending invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const invite = await workspaceInviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
      });

      // Act
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const { accessToken } = await authService.authenticateUser(admin);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { inviteId: invite.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInviteCancelled(invite.id);
    });

    it('should not allow a stranger to cancel an invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const stranger = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const invite = await workspaceInviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
      });

      // Act
      const { accessToken } = await authService.authenticateUser(stranger);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { inviteId: invite.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
      await expectInvitePending(invite.id);
    });

    it('should not allow invitee to cancel an invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const invite = await workspaceInviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
      });

      // Act
      const { accessToken } = await authService.authenticateUser(invitee);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { inviteId: invite.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
      await expectInvitePending(invite.id);
    });

    it('should not allow cancelling a non-pending invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const invite = await workspaceInviteFactory.create('accepted', {
        inviteeId: invitee.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
      });

      // Act
      const { accessToken } = await authService.authenticateUser(owner);
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

    it('should not allow cancelling an already cancelled invite', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const invite = await workspaceInviteFactory.create('cancelled', {
        inviteeId: invitee.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
      });

      // Act
      const { accessToken } = await authService.authenticateUser(owner);
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

    it('should allow re-inviting the same person after cancellation', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const invite = await workspaceInviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
      });

      const { accessToken } = await authService.authenticateUser(owner);
      await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { inviteId: invite.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Act — re-invite same person
      const reInviteResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation CreateWorkspaceInvite($dto: CreateWorkspaceInviteInDto!) {
              createWorkspaceInvite(dto: $dto) { id status }
            }
          `,
          variables: {
            dto: { inviteeId: invitee.id, inviterId: owner.id, workspaceId: workspace.id },
          },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(reInviteResponse);
      await expectInvitePending(reInviteResponse.body.data.createWorkspaceInvite.id);
    });
  });

  // ---------------------------------------------------------------------------
  // createWorkspaceInvite — permissions seeding
  // ---------------------------------------------------------------------------

  describe('createWorkspaceInvite — permissions', () => {
    const createMutation = `
      mutation CreateWorkspaceInvite($dto: CreateWorkspaceInviteInDto!) {
        createWorkspaceInvite(dto: $dto) { id }
      }
    `;
    const acceptMutation = `
      mutation AcceptWorkspaceInvite($inviteId: Int!) {
        acceptWorkspaceInvite(inviteId: $inviteId) { id }
      }
    `;

    it('should seed only the invited permissions on accept', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const permissions = [WorkspacePermission.CREATE_ITEM, WorkspacePermission.CREATE_PAYMENT];

      const { accessToken: ownerToken } = await authService.authenticateUser(owner);
      const createResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: createMutation,
          variables: {
            dto: {
              inviteeId: invitee.id,
              inviterId: owner.id,
              permissions,
              workspaceId: workspace.id,
            },
          },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${ownerToken}`);

      expectResponseSuccess(createResponse);
      const inviteId = createResponse.body.data.createWorkspaceInvite.id;

      // Act
      const { accessToken: inviteeToken } = await authService.authenticateUser(invitee);
      await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: acceptMutation, variables: { inviteId } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${inviteeToken}`);

      // Assert
      await expectWorkspacePermissions(workspace.id, invitee.id, permissions);
    });

    it('should seed no permissions when invited with empty permissions', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });

      const { accessToken: ownerToken } = await authService.authenticateUser(owner);
      const createResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: createMutation,
          variables: {
            dto: {
              inviteeId: invitee.id,
              inviterId: owner.id,
              permissions: [],
              workspaceId: workspace.id,
            },
          },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${ownerToken}`);

      expectResponseSuccess(createResponse);
      const inviteId = createResponse.body.data.createWorkspaceInvite.id;

      // Act
      const { accessToken: inviteeToken } = await authService.authenticateUser(invitee);
      await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: acceptMutation, variables: { inviteId } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${inviteeToken}`);

      // Assert
      await expectWorkspacePermissions(workspace.id, invitee.id, []);
    });

    it('should not allow inviting with permissions the inviter does not hold', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const member = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      await workspaceMemberFactory.create(workspace.id, member.id, {
        permissions: [WorkspacePermission.CREATE_WORKSPACE_INVITE],
      });

      // Act — member tries to grant CREATE_ITEM which they don't have
      const { accessToken } = await authService.authenticateUser(member);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: createMutation,
          variables: {
            dto: {
              inviteeId: invitee.id,
              inviterId: member.id,
              permissions: [WorkspacePermission.CREATE_ITEM],
              workspaceId: workspace.id,
            },
          },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.INSUFFICIENT_INVITER_PERMISSIONS,
        status: 'FORBIDDEN',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // grantWorkspaceMemberPermissions
  // ---------------------------------------------------------------------------

  describe('grantWorkspaceMemberPermissions', () => {
    const mutation = `
      mutation GrantWorkspaceMemberPermissions($memberId: Int!, $permissions: [WorkspacePermission!]!) {
        grantWorkspaceMemberPermissions(memberId: $memberId, permissions: $permissions)
      }
    `;

    it('should allow workspace owner to grant any permissions', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const member = await workspaceMemberFactory.create(workspace.id, user.id, {
        permissions: [],
      });

      // Act
      const { accessToken } = await authService.authenticateUser(owner);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: { memberId: member.id, permissions: [WorkspacePermission.CREATE_ITEM] },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectWorkspacePermissions(workspace.id, user.id, [WorkspacePermission.CREATE_ITEM]);
    });

    it('should allow admin to grant any permissions', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const user = await userFactory.create('active');
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const member = await workspaceMemberFactory.create(workspace.id, user.id, {
        permissions: [],
      });

      // Act
      const { accessToken } = await authService.authenticateUser(admin);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: { memberId: member.id, permissions: [WorkspacePermission.CREATE_ITEM] },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectWorkspacePermissions(workspace.id, user.id, [WorkspacePermission.CREATE_ITEM]);
    });

    it('should allow member with GRANT_WORKSPACE_PERMISSION to grant permissions they hold', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const granter = await userFactory.create('active');
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      await workspaceMemberFactory.create(workspace.id, granter.id, {
        permissions: [
          WorkspacePermission.GRANT_WORKSPACE_PERMISSION,
          WorkspacePermission.CREATE_ITEM,
        ],
      });
      const member = await workspaceMemberFactory.create(workspace.id, user.id, {
        permissions: [],
      });

      // Act
      const { accessToken } = await authService.authenticateUser(granter);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: { memberId: member.id, permissions: [WorkspacePermission.CREATE_ITEM] },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectWorkspacePermissions(workspace.id, user.id, [WorkspacePermission.CREATE_ITEM]);
    });

    it('should not allow member with GRANT_WORKSPACE_PERMISSION to grant permissions they do not hold', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const granter = await userFactory.create('active');
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      await workspaceMemberFactory.create(workspace.id, granter.id, {
        permissions: [WorkspacePermission.GRANT_WORKSPACE_PERMISSION],
      });
      const member = await workspaceMemberFactory.create(workspace.id, user.id, {
        permissions: [],
      });

      // Act
      const { accessToken } = await authService.authenticateUser(granter);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: { memberId: member.id, permissions: [WorkspacePermission.CREATE_ITEM] },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.INSUFFICIENT_ACTOR_PERMISSIONS,
        status: 'FORBIDDEN',
      });
    });

    it('should not allow member without GRANT_WORKSPACE_PERMISSION to grant permissions', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const granter = await userFactory.create('active');
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      await workspaceMemberFactory.create(workspace.id, granter.id, {
        permissions: [WorkspacePermission.CREATE_ITEM],
      });
      const member = await workspaceMemberFactory.create(workspace.id, user.id, {
        permissions: [],
      });

      // Act
      const { accessToken } = await authService.authenticateUser(granter);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: { memberId: member.id, permissions: [WorkspacePermission.CREATE_ITEM] },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });
  });

  // ---------------------------------------------------------------------------
  // revokeWorkspaceMemberPermissions
  // ---------------------------------------------------------------------------

  describe('revokeWorkspaceMemberPermissions', () => {
    const mutation = `
      mutation RevokeWorkspaceMemberPermissions($memberId: Int!, $permissions: [WorkspacePermission!]!) {
        revokeWorkspaceMemberPermissions(memberId: $memberId, permissions: $permissions)
      }
    `;

    it('should allow workspace owner to revoke any permissions', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const member = await workspaceMemberFactory.create(workspace.id, user.id, {
        permissions: [WorkspacePermission.CREATE_ITEM],
      });

      // Act
      const { accessToken } = await authService.authenticateUser(owner);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: { memberId: member.id, permissions: [WorkspacePermission.CREATE_ITEM] },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectWorkspacePermissions(workspace.id, user.id, []);
    });

    it('should allow admin to revoke any permissions', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const user = await userFactory.create('active');
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const member = await workspaceMemberFactory.create(workspace.id, user.id, {
        permissions: [WorkspacePermission.CREATE_ITEM],
      });

      // Act
      const { accessToken } = await authService.authenticateUser(admin);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: { memberId: member.id, permissions: [WorkspacePermission.CREATE_ITEM] },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectWorkspacePermissions(workspace.id, user.id, []);
    });

    it('should allow member with REVOKE_WORKSPACE_PERMISSION to revoke permissions they hold', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const revoker = await userFactory.create('active');
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      await workspaceMemberFactory.create(workspace.id, revoker.id, {
        permissions: [
          WorkspacePermission.REVOKE_WORKSPACE_PERMISSION,
          WorkspacePermission.CREATE_ITEM,
        ],
      });
      const member = await workspaceMemberFactory.create(workspace.id, user.id, {
        permissions: [WorkspacePermission.CREATE_ITEM],
      });

      // Act
      const { accessToken } = await authService.authenticateUser(revoker);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: { memberId: member.id, permissions: [WorkspacePermission.CREATE_ITEM] },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectWorkspacePermissions(workspace.id, user.id, []);
    });

    it('should not allow member with REVOKE_WORKSPACE_PERMISSION to revoke permissions they do not hold', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const revoker = await userFactory.create('active');
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      await workspaceMemberFactory.create(workspace.id, revoker.id, {
        permissions: [WorkspacePermission.REVOKE_WORKSPACE_PERMISSION],
      });
      const member = await workspaceMemberFactory.create(workspace.id, user.id, {
        permissions: [WorkspacePermission.CREATE_ITEM],
      });

      // Act
      const { accessToken } = await authService.authenticateUser(revoker);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: { memberId: member.id, permissions: [WorkspacePermission.CREATE_ITEM] },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.INSUFFICIENT_ACTOR_PERMISSIONS,
        status: 'FORBIDDEN',
      });
    });

    it('should not allow member without REVOKE_WORKSPACE_PERMISSION to revoke permissions', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const revoker = await userFactory.create('active');
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      await workspaceMemberFactory.create(workspace.id, revoker.id, {
        permissions: [WorkspacePermission.CREATE_ITEM],
      });
      const member = await workspaceMemberFactory.create(workspace.id, user.id, {
        permissions: [WorkspacePermission.CREATE_ITEM],
      });

      // Act
      const { accessToken } = await authService.authenticateUser(revoker);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: { memberId: member.id, permissions: [WorkspacePermission.CREATE_ITEM] },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });
  });

  // ---------------------------------------------------------------------------
  // leaveWorkspace
  // ---------------------------------------------------------------------------

  describe('leaveWorkspace', () => {
    const mutation = `
      mutation LeaveWorkspace($memberId: Int!) {
        leaveWorkspace(memberId: $memberId) { id removedAt }
      }
    `;

    it('should allow member to leave workspace', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const member = await workspaceMemberFactory.create(workspace.id, user.id);

      // Act
      const { accessToken } = await authService.authenticateUser(user);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { memberId: member.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectRemovedMember(member.id, user.id);
    });

    it('should remove workspace permissions on leave', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const member = await workspaceMemberFactory.create(workspace.id, user.id, {
        permissions: [WorkspacePermission.CREATE_ITEM, WorkspacePermission.CREATE_PAYMENT],
      });

      // Act
      const { accessToken } = await authService.authenticateUser(user);
      await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { memberId: member.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      await expectWorkspacePermissions(workspace.id, user.id, []);
    });

    it('should not allow owner to leave workspace', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const ownerMember = await workspaceMemberFactory.create(workspace.id, owner.id, {
        permissions: [],
      });

      // Act
      const { accessToken } = await authService.authenticateUser(owner);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { memberId: ownerMember.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.CANNOT_REMOVE_WORKSPACE_OWNER,
        status: 'BAD_REQUEST',
      });
    });

    it('should not allow a member to leave on behalf of another member', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const user = await userFactory.create('active');
      const otherUser = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const member = await workspaceMemberFactory.create(workspace.id, user.id);
      await workspaceMemberFactory.create(workspace.id, otherUser.id);

      // Act
      const { accessToken } = await authService.authenticateUser(otherUser);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { memberId: member.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should allow admin to force-leave any member', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const user = await userFactory.create('active');
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const member = await workspaceMemberFactory.create(workspace.id, user.id);

      // Act
      const { accessToken } = await authService.authenticateUser(admin);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { memberId: member.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectRemovedMember(member.id, user.id);
    });
  });

  // ---------------------------------------------------------------------------
  // removeWorkspaceMember
  // ---------------------------------------------------------------------------

  describe('removeWorkspaceMember', () => {
    const mutation = `
      mutation RemoveWorkspaceMember($memberId: Int!) {
        removeWorkspaceMember(memberId: $memberId) { id removedAt }
      }
    `;

    it('should allow workspace owner to remove a member', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const member = await workspaceMemberFactory.create(workspace.id, user.id);

      // Act
      const { accessToken } = await authService.authenticateUser(owner);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { memberId: member.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectRemovedMember(member.id, user.id);
    });

    it('should remove workspace permissions on removal', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const member = await workspaceMemberFactory.create(workspace.id, user.id, {
        permissions: [WorkspacePermission.CREATE_ITEM, WorkspacePermission.CREATE_PAYMENT],
      });

      // Act
      const { accessToken } = await authService.authenticateUser(owner);
      await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { memberId: member.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      await expectWorkspacePermissions(workspace.id, user.id, []);
    });

    it('should allow member with REMOVE_WORKSPACE_MEMBER to remove another member', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const remover = await userFactory.create('active');
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      await workspaceMemberFactory.create(workspace.id, remover.id, {
        permissions: [WorkspacePermission.REMOVE_WORKSPACE_MEMBER],
      });
      const member = await workspaceMemberFactory.create(workspace.id, user.id);

      // Act
      const { accessToken } = await authService.authenticateUser(remover);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { memberId: member.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectRemovedMember(member.id, user.id);
    });

    it('should not allow member without REMOVE_WORKSPACE_MEMBER to remove a member', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const remover = await userFactory.create('active');
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      await workspaceMemberFactory.create(workspace.id, remover.id, {
        permissions: [WorkspacePermission.CREATE_ITEM],
      });
      const member = await workspaceMemberFactory.create(workspace.id, user.id);

      // Act
      const { accessToken } = await authService.authenticateUser(remover);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { memberId: member.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not allow removing the workspace owner', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const ownerMember = await workspaceMemberFactory.create(workspace.id, owner.id, {
        permissions: [],
      });

      // Act
      const { accessToken } = await authService.authenticateUser(owner);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { memberId: ownerMember.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.CANNOT_REMOVE_WORKSPACE_OWNER,
        status: 'BAD_REQUEST',
      });
    });

    it('should allow admin to remove any member', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const user = await userFactory.create('active');
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const member = await workspaceMemberFactory.create(workspace.id, user.id);

      // Act
      const { accessToken } = await authService.authenticateUser(admin);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation, variables: { memberId: member.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectRemovedMember(member.id, user.id);
    });
  });

  // ---------------------------------------------------------------------------
  // Removed member with orphaned permission rows
  // ---------------------------------------------------------------------------

  describe('removed member with orphaned permissions', () => {
    const removeWorkspaceMemberMutation = `
      mutation RemoveWorkspaceMember($memberId: Int!) {
        removeWorkspaceMember(memberId: $memberId) { id }
      }
    `;

    it('should deny permission-gated mutation to a removed member with orphaned permission rows', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const user = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const member = await workspaceMemberFactory.create(workspace.id, user.id, {
        permissions: [WorkspacePermission.CREATE_WORKSPACE_INVITE],
      });

      const { accessToken: ownerToken } = await authService.authenticateUser(owner);
      await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: removeWorkspaceMemberMutation, variables: { memberId: member.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${ownerToken}`);

      // Simulate a failed revokeAllPermissions — re-insert the orphaned row
      await prisma.userWorkspacePermission.create({
        data: {
          permission: WorkspacePermission.CREATE_WORKSPACE_INVITE,
          userId: user.id,
          workspaceId: workspace.id,
        },
      });

      // Act — removed member tries to use the permission
      const { accessToken: memberToken } = await authService.authenticateUser(user);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation CreateWorkspaceInvite($dto: CreateWorkspaceInviteInDto!) {
              createWorkspaceInvite(dto: $dto) { id }
            }
          `,
          variables: {
            dto: { inviteeId: invitee.id, inviterId: user.id, workspaceId: workspace.id },
          },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${memberToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should deny removed member from granting permissions even with orphaned permission rows', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const granter = await userFactory.create('active');
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const granterMember = await workspaceMemberFactory.create(workspace.id, granter.id, {
        permissions: [
          WorkspacePermission.GRANT_WORKSPACE_PERMISSION,
          WorkspacePermission.CREATE_ITEM,
        ],
      });
      const targetMember = await workspaceMemberFactory.create(workspace.id, user.id, {
        permissions: [],
      });

      const { accessToken: ownerToken } = await authService.authenticateUser(owner);
      await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: removeWorkspaceMemberMutation, variables: { memberId: granterMember.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${ownerToken}`);

      // Simulate orphaned permission rows for the removed granter
      await prisma.userWorkspacePermission.createMany({
        data: [
          {
            permission: WorkspacePermission.GRANT_WORKSPACE_PERMISSION,
            userId: granter.id,
            workspaceId: workspace.id,
          },
          {
            permission: WorkspacePermission.CREATE_ITEM,
            userId: granter.id,
            workspaceId: workspace.id,
          },
        ],
      });

      // Act — removed granter tries to grant a permission
      const { accessToken: granterToken } = await authService.authenticateUser(granter);
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation GrantWorkspaceMemberPermissions($memberId: Int!, $permissions: [WorkspacePermission!]!) {
              grantWorkspaceMemberPermissions(memberId: $memberId, permissions: $permissions)
            }
          `,
          variables: { memberId: targetMember.id, permissions: [WorkspacePermission.CREATE_ITEM] },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${granterToken}`);

      // Assert
      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
      await expectWorkspacePermissions(workspace.id, user.id, []);
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
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const pendingInvite = await workspaceInviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
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

    it('should return only pending invites on Workspace.pendingInvites', async () => {
      // Assume
      const owner = await userFactory.create('active');
      const invitee1 = await userFactory.create('active');
      const invitee2 = await userFactory.create('active');
      const invitee3 = await userFactory.create('active');
      const workspace = await workspaceFactory.create({ ownerId: owner.id });
      const pendingInvite = await workspaceInviteFactory.create('pending', {
        inviteeId: invitee1.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
      });
      const acceptedInvite = await workspaceInviteFactory.create('accepted', {
        inviteeId: invitee2.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
      });
      const rejectedInvite = await workspaceInviteFactory.create('rejected', {
        inviteeId: invitee3.id,
        inviterId: owner.id,
        workspaceId: workspace.id,
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
      const ids = invites.map((i: WorkspaceInvite) => i.id);
      expect(ids).toContain(pendingInvite.id);
      expect(ids).not.toContain(acceptedInvite.id);
      expect(ids).not.toContain(rejectedInvite.id);
      expect(
        invites.every((i: WorkspaceInvite) => i.status === WorkspaceInviteStatus.PENDING),
      ).toBe(true);
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

  async function expectInviteCancelled(inviteId: number) {
    const invite = await prisma.workspaceInvite.findUnique({ where: { id: inviteId } });
    expect(invite).toBeDefined();
    expect(invite.status).toBe(WorkspaceInviteStatus.CANCELLED);
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
      where: { removedAt: null, userId, workspaceId },
    });
    expect(member).toBeDefined();
    expect(member.userId).toBe(userId);
  }

  async function expectRemovedMember(memberId: number, userId: number) {
    const member = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
    expect(member).toBeDefined();
    expect(member.userId).toBe(userId);
    expect(member.removedAt).toEqual(expect.any(Date));
    expect(member.removedByUserId).toBeDefined();
  }

  async function expectWorkspacePermissions(
    workspaceId: number,
    userId: number,
    permissions: WorkspacePermission[],
  ) {
    const granted = await prisma.userWorkspacePermission.findMany({
      select: { permission: true },
      where: { userId, workspaceId },
    });
    const grantedSet = new Set(granted.map((r) => r.permission));
    expect(grantedSet).toEqual(new Set(permissions));
  }
});
