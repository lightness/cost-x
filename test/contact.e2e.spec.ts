import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Contact, Invite, User } from '../generated/prisma/client';
import { AuthService } from '../src/auth/auth.service';
import { ApplicationErrorCode } from '../src/common/error/coded-application.error';
import { configureApp } from '../src/configure-app';
import { ContactModule } from '../src/contact/contact.module';
import { InviteStatus } from '../src/contact/entity/invite-status.enum';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '../src/user/entity/user-role.enum';
import { ContactFactoryService } from './factory/contact-factory.service';
import { FactoryModule } from './factory/factory.module';
import { InviteFactoryService } from './factory/invite-factory.service';
import { UserBlockFactoryService } from './factory/user-block-factory.service';
import { UserFactoryService } from './factory/user-factory.service';
import { TestConfigModule } from './test-config.module';

describe('Contact E2E', () => {
  let moduleRef: TestingModule;
  let app: NestApplication;
  let authService: AuthService;
  let prisma: PrismaService;
  let contactFactory: ContactFactoryService;
  let inviteFactory: InviteFactoryService;
  let userBlockFactory: UserBlockFactoryService;
  let userFactory: UserFactoryService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TestConfigModule, FactoryModule, ContactModule, GraphqlModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    authService = moduleRef.get(AuthService);
    prisma = moduleRef.get(PrismaService);
    contactFactory = moduleRef.get(ContactFactoryService);
    inviteFactory = moduleRef.get(InviteFactoryService);
    userBlockFactory = moduleRef.get(UserBlockFactoryService);
    userFactory = moduleRef.get(UserFactoryService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('invite', () => {
    const getInviteId = (response) => response.body?.data?.createInvite?.id;

    it('should be possible to invite user', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');

      // Act
      const query = `
        mutation CreateInvite($dto: CreateInviteInDto!) {
          createInvite(dto: $dto) {
            id
          }
        }
      `;

      const variables = {
        dto: {
          inviteeUserId: invitee.id,
          inviterUserId: inviter.id,
        },
      };

      const { accessToken } = await authService.authenticateUser(inviter);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInvitePending(getInviteId(response), { invitee, inviter });
    });

    it('should not be possible to invite user, if pending invite exists', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });

      // Act
      const query = `
        mutation CreateInvite($dto: CreateInviteInDto!) {
          createInvite(dto: $dto) {
            id
          }
        }
      `;

      const variables = {
        dto: {
          inviteeUserId: invitee.id,
          inviterUserId: inviter.id,
        },
      };

      const { accessToken } = await authService.authenticateUser(inviter);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.INVITER_ALREADY_SEND_INVITE,
        status: 'BAD_REQUEST',
      });
    });

    it('should be possible to invite user, if non-pending invite exists', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      await inviteFactory.create('rejected', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });

      // Act
      const query = `
        mutation CreateInvite($dto: CreateInviteInDto!) {
          createInvite(dto: $dto) {
            id
          }
        }
      `;

      const variables = {
        dto: {
          inviteeUserId: invitee.id,
          inviterUserId: inviter.id,
        },
      };

      const { accessToken } = await authService.authenticateUser(inviter);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInvitePending(getInviteId(response), { invitee, inviter });
    });

    it('should not be possible to invite user, if pending invite exists (reverse)', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      await inviteFactory.create('pending', {
        inviteeId: inviter.id,
        inviterId: invitee.id,
      });

      // Act
      const query = `
        mutation CreateInvite($dto: CreateInviteInDto!) {
          createInvite(dto: $dto) {
            id
          }
        }
      `;

      const variables = {
        dto: {
          inviteeUserId: invitee.id,
          inviterUserId: inviter.id,
        },
      };

      const { accessToken } = await authService.authenticateUser(inviter);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.INVITEE_ALREADY_SEND_INVITE,
        status: 'BAD_REQUEST',
      });
    });

    it('should be possible to invite user, if non-pending invite exists (reverse)', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      await inviteFactory.create('rejected', {
        inviteeId: inviter.id,
        inviterId: invitee.id,
      });

      // Act
      const query = `
        mutation CreateInvite($dto: CreateInviteInDto!) {
          createInvite(dto: $dto) {
            id
          }
        }
      `;

      const variables = {
        dto: {
          inviteeUserId: invitee.id,
          inviterUserId: inviter.id,
        },
      };

      const { accessToken } = await authService.authenticateUser(inviter);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInvitePending(getInviteId(response), { invitee, inviter });
    });

    it('should not be possible to invite user, if contact exists', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('accepted');
      await contactFactory.create('active', {
        inviteId: invite.id,
        sourceUserId: inviter.id,
        targetUserId: invitee.id,
      });

      // Act
      const query = `
        mutation CreateInvite($dto: CreateInviteInDto!) {
          createInvite(dto: $dto) {
            id
          }
        }
      `;

      const variables = {
        dto: {
          inviteeUserId: invitee.id,
          inviterUserId: inviter.id,
        },
      };

      const { accessToken } = await authService.authenticateUser(inviter);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.CONTACT_ALREADY_EXISTS,
        status: 'BAD_REQUEST',
      });
    });

    it('should be possible to invite user, if removed contact exists', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('accepted');
      await contactFactory.create('removed-by-source-user', {
        inviteId: invite.id,
        sourceUserId: inviter.id,
        targetUserId: invitee.id,
      });

      // Act
      const query = `
        mutation CreateInvite($dto: CreateInviteInDto!) {
          createInvite(dto: $dto) {
            id
          }
        }
      `;

      const variables = {
        dto: {
          inviteeUserId: invitee.id,
          inviterUserId: inviter.id,
        },
      };

      const { accessToken } = await authService.authenticateUser(inviter);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInvitePending(getInviteId(response), { invitee, inviter });
    });

    it('should not be possible to invite user, if invitee blocked inviter', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      await userBlockFactory.create('active', {
        blockedId: inviter.id,
        blockerId: invitee.id,
      });

      // Act
      const query = `
        mutation CreateInvite($dto: CreateInviteInDto!) {
          createInvite(dto: $dto) {
            id
          }
        }
      `;

      const variables = {
        dto: {
          inviteeUserId: invitee.id,
          inviterUserId: inviter.id,
        },
      };

      const { accessToken } = await authService.authenticateUser(inviter);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.INVITEE_BLOCKED_INVITER,
        status: 'BAD_REQUEST',
      });
    });

    it('should be possible to invite user, if invitee unblocked inviter', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      await userBlockFactory.create('removed', {
        blockedId: inviter.id,
        blockerId: invitee.id,
      });

      // Act
      const query = `
        mutation CreateInvite($dto: CreateInviteInDto!) {
          createInvite(dto: $dto) {
            id
          }
        }
      `;

      const variables = {
        dto: {
          inviteeUserId: invitee.id,
          inviterUserId: inviter.id,
        },
      };

      const { accessToken } = await authService.authenticateUser(inviter);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInvitePending(getInviteId(response), { invitee, inviter });
    });

    it('should not be possible to invite user, if inviter blocked invitee', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      await userBlockFactory.create('active', {
        blockedId: invitee.id,
        blockerId: inviter.id,
      });

      // Act
      const query = `
        mutation CreateInvite($dto: CreateInviteInDto!) {
          createInvite(dto: $dto) {
            id
          }
        }
      `;

      const variables = {
        dto: {
          inviteeUserId: invitee.id,
          inviterUserId: inviter.id,
        },
      };

      const { accessToken } = await authService.authenticateUser(inviter);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.INVITER_BLOCKED_INVITEE,
        status: 'BAD_REQUEST',
      });
    });

    it('should be possible to invite user, if inviter unblocked invitee', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      await userBlockFactory.create('removed', {
        blockedId: invitee.id,
        blockerId: inviter.id,
      });

      // Act
      const query = `
        mutation CreateInvite($dto: CreateInviteInDto!) {
          createInvite(dto: $dto) {
            id
          }
        }
      `;

      const variables = {
        dto: {
          inviteeUserId: invitee.id,
          inviterUserId: inviter.id,
        },
      };

      const { accessToken } = await authService.authenticateUser(inviter);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInvitePending(getInviteId(response), { invitee, inviter });
    });
  });

  describe('accept invite', () => {
    it('should be possible for invitee to accept invite', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });

      // Act
      const query = `
        mutation AcceptInvite($inviteId: Int!) {
          acceptInvite(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(invitee);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInviteAccepted(invite, { invitee, inviter });
      await expectActiveContactPairExists(inviter, invitee, { invite });
    });

    it('should not be possible for inviter to accept invite', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });

      // Act
      const query = `
        mutation AcceptInvite($inviteId: Int!) {
          acceptInvite(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(inviter);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: 'FORBIDDEN', status: undefined });
      await expectInvitePending(invite.id, { invitee, inviter });
    });

    it('should not be possible to accept invite, if contact exists', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });
      await contactFactory.create('active', {
        sourceUserId: inviter.id,
        targetUserId: invitee.id,
      });

      // Act
      const query = `
        mutation AcceptInvite($inviteId: Int!) {
          acceptInvite(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(invitee);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.CONTACT_ALREADY_EXISTS,
        status: 'BAD_REQUEST',
      });
      await expectInvitePending(invite.id, { invitee, inviter });
    });

    it('should be possible to accept invite, if removed contact exists', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });
      await contactFactory.create('removed-by-source-user', {
        sourceUserId: inviter.id,
        targetUserId: invitee.id,
      });

      // Act
      const query = `
        mutation AcceptInvite($inviteId: Int!) {
          acceptInvite(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(invitee);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInviteAccepted(invite, { invitee, inviter });
      await expectActiveContactPairExists(inviter, invitee, { invite });
    });

    it('should not be possible to invite user, if invitee blocked inviter', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });
      await userBlockFactory.create('active', {
        blockedId: inviter.id,
        blockerId: invitee.id,
      });

      // Act
      const query = `
        mutation AcceptInvite($inviteId: Int!) {
          acceptInvite(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(invitee);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.INVITEE_BLOCKED_INVITER,
        status: 'BAD_REQUEST',
      });
      await expectInvitePending(invite.id, { invitee, inviter });
    });

    it('should be possible to invite user, if invitee unblocked inviter', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });
      await userBlockFactory.create('removed', {
        blockedId: inviter.id,
        blockerId: invitee.id,
      });

      // Act
      const query = `
        mutation AcceptInvite($inviteId: Int!) {
          acceptInvite(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(invitee);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInviteAccepted(invite, { invitee, inviter });
      await expectActiveContactPairExists(inviter, invitee, { invite });
    });

    it('should not be possible to invite user, if inviter blocked invitee', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });
      await userBlockFactory.create('active', {
        blockedId: invitee.id,
        blockerId: inviter.id,
      });

      // Act
      const query = `
        mutation AcceptInvite($inviteId: Int!) {
          acceptInvite(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(invitee);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.INVITER_BLOCKED_INVITEE,
        status: 'BAD_REQUEST',
      });
      await expectInvitePending(invite.id, { invitee, inviter });
    });

    it('should be possible to invite user, if inviter unblocked invitee', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });
      await userBlockFactory.create('removed', {
        blockedId: invitee.id,
        blockerId: inviter.id,
      });

      // Act
      const query = `
        mutation AcceptInvite($inviteId: Int!) {
          acceptInvite(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(invitee);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInviteAccepted(invite, { invitee, inviter });
      await expectActiveContactPairExists(inviter, invitee, { invite });
    });
  });

  describe('reject invite', () => {
    it('should be possible for invitee to reject invite', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });

      // Act
      const query = `
        mutation RejectInvite ($inviteId: Int!) {
          rejectInvite(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(invitee);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInviteRejected(invite, { invitee, inviter });
      await expectActiveContactPairNotExists(inviter, invitee, { invite });
    });

    it('should not be possible for inviter to reject invite', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });

      // Act
      const query = `
        mutation RejectInvite ($inviteId: Int!) {
          rejectInvite(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(inviter);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: 'FORBIDDEN', status: undefined });
      await expectInvitePending(invite.id, { invitee, inviter });
      await expectActiveContactPairNotExists(inviter, invitee, { invite });
    });

    it('should not be possible to reject invite, if contact exists', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });
      await contactFactory.create('active', {
        sourceUserId: inviter.id,
        targetUserId: invitee.id,
      });

      // Act
      const query = `
        mutation RejectInvite ($inviteId: Int!) {
          rejectInvite(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(invitee);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.CONTACT_ALREADY_EXISTS,
        status: 'BAD_REQUEST',
      });
      await expectInvitePending(invite.id, { invitee, inviter });
      await expectActiveContactPairNotExists(inviter, invitee, { invite });
    });

    it('should be possible to reject invite, if removed contact exists', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });
      await contactFactory.create('removed-by-source-user', {
        sourceUserId: inviter.id,
        targetUserId: invitee.id,
      });

      // Act
      const query = `
        mutation RejectInvite ($inviteId: Int!) {
          rejectInvite(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(invitee);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInviteRejected(invite, { invitee, inviter });
      await expectActiveContactPairNotExists(inviter, invitee, { invite });
    });

    it('should not be possible to invite user, if invitee blocked inviter', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });
      await userBlockFactory.create('active', {
        blockedId: inviter.id,
        blockerId: invitee.id,
      });

      // Act
      const query = `
        mutation RejectInvite ($inviteId: Int!) {
          rejectInvite(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(invitee);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.INVITEE_BLOCKED_INVITER,
        status: 'BAD_REQUEST',
      });
      await expectInvitePending(invite.id, { invitee, inviter });
      await expectActiveContactPairNotExists(inviter, invitee, { invite });
    });

    it('should be possible to invite user, if invitee unblocked inviter', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });
      await userBlockFactory.create('removed', {
        blockedId: inviter.id,
        blockerId: invitee.id,
      });

      // Act
      const query = `
        mutation RejectInvite ($inviteId: Int!) {
          rejectInvite(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(invitee);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInviteRejected(invite, { invitee, inviter });
      await expectActiveContactPairNotExists(inviter, invitee, { invite });
    });

    it('should not be possible to invite user, if inviter blocked invitee', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });
      await userBlockFactory.create('active', {
        blockedId: invitee.id,
        blockerId: inviter.id,
      });

      // Act
      const query = `
        mutation RejectInvite ($inviteId: Int!) {
          rejectInvite(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(invitee);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.INVITER_BLOCKED_INVITEE,
        status: 'BAD_REQUEST',
      });
      await expectInvitePending(invite.id, { invitee, inviter });
      await expectActiveContactPairNotExists(inviter, invitee, { invite });
    });

    it('should be possible to invite user, if inviter unblocked invitee', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });
      await userBlockFactory.create('removed', {
        blockedId: invitee.id,
        blockerId: inviter.id,
      });

      // Act
      const query = `
        mutation RejectInvite ($inviteId: Int!) {
          rejectInvite(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(invitee);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInviteRejected(invite, { invitee, inviter });
      await expectActiveContactPairNotExists(inviter, invitee, { invite });
    });
  });

  describe('reject invite and block', () => {
    it('should be possible for invitee to reject invite and block inviter', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });

      // Act
      const query = `
        mutation RejectInviteAndBlock ($inviteId: Int!) {
          rejectInviteAndBlockUser(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(invitee);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInviteRejected(invite, { invitee, inviter });
      await expectActiveContactPairNotExists(inviter, invitee, { invite });
      await expectActiveUserBlock(invitee, inviter);
    });

    it('should not be possible for inviter to reject invite', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });

      // Act
      const query = `
        mutation RejectInviteAndBlock ($inviteId: Int!) {
          rejectInviteAndBlockUser(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(inviter);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: 'FORBIDDEN', status: undefined });
      await expectInvitePending(invite.id, { invitee, inviter });
      await expectActiveContactPairNotExists(inviter, invitee, { invite });
      await expectNoActiveUserBlock(invitee, inviter);
    });

    it('should not be possible to reject invite, if contact exists', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });
      await contactFactory.create('active', {
        sourceUserId: inviter.id,
        targetUserId: invitee.id,
      });

      // Act
      const query = `
        mutation RejectInviteAndBlock ($inviteId: Int!) {
          rejectInviteAndBlockUser(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(invitee);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.CONTACT_ALREADY_EXISTS,
        status: 'BAD_REQUEST',
      });
      await expectInvitePending(invite.id, { invitee, inviter });
      await expectActiveContactPairNotExists(inviter, invitee, { invite });
      await expectNoActiveUserBlock(invitee, inviter);
    });

    it('should be possible to reject invite, if removed contact exists', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });
      await contactFactory.create('removed-by-source-user', {
        sourceUserId: inviter.id,
        targetUserId: invitee.id,
      });

      // Act
      const query = `
        mutation RejectInviteAndBlock ($inviteId: Int!) {
          rejectInviteAndBlockUser(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(invitee);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInviteRejected(invite, { invitee, inviter });
      await expectActiveContactPairNotExists(inviter, invitee, { invite });
      await expectActiveUserBlock(invitee, inviter);
    });

    it('should not be possible to reject invite, if invitee blocked inviter', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });
      await userBlockFactory.create('active', {
        blockedId: inviter.id,
        blockerId: invitee.id,
      });

      // Act
      const query = `
        mutation RejectInviteAndBlock ($inviteId: Int!) {
          rejectInviteAndBlockUser(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(invitee);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.INVITEE_BLOCKED_INVITER,
        status: 'BAD_REQUEST',
      });
      await expectInvitePending(invite.id, { invitee, inviter });
      await expectActiveContactPairNotExists(inviter, invitee, { invite });
      await expectActiveUserBlock(invitee, inviter); // remains same from "Assume" section
    });

    it('should be possible to invite user, if invitee unblocked inviter', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });
      await userBlockFactory.create('removed', {
        blockedId: inviter.id,
        blockerId: invitee.id,
      });

      // Act
      const query = `
        mutation RejectInviteAndBlock ($inviteId: Int!) {
          rejectInviteAndBlockUser(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(invitee);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInviteRejected(invite, { invitee, inviter });
      await expectActiveContactPairNotExists(inviter, invitee, { invite });
      await expectActiveUserBlock(invitee, inviter);
    });

    it('should not be possible to invite user, if inviter blocked invitee', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });
      await userBlockFactory.create('active', {
        blockedId: invitee.id,
        blockerId: inviter.id,
      });

      // Act
      const query = `
        mutation RejectInviteAndBlock ($inviteId: Int!) {
          rejectInviteAndBlockUser(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(invitee);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.INVITER_BLOCKED_INVITEE,
        status: 'BAD_REQUEST',
      });
      await expectInvitePending(invite.id, { invitee, inviter });
      await expectActiveContactPairNotExists(inviter, invitee, { invite });
      await expectNoActiveUserBlock(invitee, inviter);
    });

    it('should be possible to invite user, if inviter unblocked invitee', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('pending', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });
      await userBlockFactory.create('removed', {
        blockedId: invitee.id,
        blockerId: inviter.id,
      });

      // Act
      const query = `
        mutation RejectInviteAndBlock ($inviteId: Int!) {
          rejectInviteAndBlockUser(inviteId: $inviteId) {
            id
          }
        }
      `;

      const variables = {
        inviteId: invite.id,
      };

      const { accessToken } = await authService.authenticateUser(invitee);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectInviteRejected(invite, { invitee, inviter });
      await expectActiveContactPairNotExists(inviter, invitee, { invite });
      await expectActiveUserBlock(invitee, inviter);
    });
  });

  describe('delete contact', () => {
    it('should be possible to delete contact by source user', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('accepted', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });
      const sourceUser = invitee;
      const targetUser = inviter;
      const [contact, reverseContact] = await contactFactory.createActivePair({
        inviteId: invite.id,
        sourceUserId: sourceUser.id,
        targetUserId: targetUser.id,
      });

      // Act
      const query = `
        mutation DeleteContact ($contactId: Int!) {
          deleteContact(contactId: $contactId) {
            id
          }
        }
      `;

      const variables = {
        contactId: contact.id,
      };

      const { accessToken } = await authService.authenticateUser(sourceUser);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectContactIsRemoved(contact, { invite, sourceUser, targetUser });
      await expectContactIsRemoved(reverseContact, {
        invite,
        sourceUser: targetUser,
        targetUser: sourceUser,
      });
      await expectInviteAccepted(invite, { invitee, inviter });
      await expectActiveContactPairNotExists(sourceUser, targetUser, { invite });
      await expectNoActiveUserBlock(sourceUser, targetUser);
      await expectNoActiveUserBlock(targetUser, sourceUser);
    });

    it('should be possible to delete contact by admin', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('accepted', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });
      const sourceUser = invitee;
      const targetUser = inviter;
      const [contact, reverseContact] = await contactFactory.createActivePair({
        inviteId: invite.id,
        sourceUserId: sourceUser.id,
        targetUserId: targetUser.id,
      });
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });

      // Act
      const query = `
        mutation DeleteContact ($contactId: Int!) {
          deleteContact(contactId: $contactId) {
            id
          }
        }
      `;

      const variables = {
        contactId: contact.id,
      };

      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);
      await expectContactIsRemoved(contact, { invite, sourceUser, targetUser });
      await expectContactIsRemoved(reverseContact, {
        invite,
        sourceUser: targetUser,
        targetUser: sourceUser,
      });
      await expectInviteAccepted(invite, { invitee, inviter });
      await expectActiveContactPairNotExists(sourceUser, targetUser, { invite });
      await expectNoActiveUserBlock(sourceUser, targetUser);
      await expectNoActiveUserBlock(targetUser, sourceUser);
    });

    it('should not be possible to delete contact by target user', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('accepted', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });
      const sourceUser = invitee;
      const targetUser = inviter;
      const [contact, reverseContact] = await contactFactory.createActivePair({
        inviteId: invite.id,
        sourceUserId: sourceUser.id,
        targetUserId: targetUser.id,
      });

      // Act
      const query = `
        mutation DeleteContact ($contactId: Int!) {
          deleteContact(contactId: $contactId) {
            id
          }
        }
      `;

      const variables = {
        contactId: contact.id,
      };

      const { accessToken } = await authService.authenticateUser(targetUser);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: 'FORBIDDEN', status: undefined });
      await expectContactIsActive(contact, { invite, sourceUser, targetUser });
      await expectContactIsActive(reverseContact, {
        invite,
        sourceUser: targetUser,
        targetUser: sourceUser,
      });
      await expectInviteAccepted(invite, { invitee, inviter });
      await expectNoActiveUserBlock(sourceUser, targetUser);
      await expectNoActiveUserBlock(targetUser, sourceUser);
    });

    it(`should not be possible to delete contact by foreign user`, async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('accepted', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });
      const sourceUser = invitee;
      const targetUser = inviter;
      const [contact, reverseContact] = await contactFactory.createActivePair({
        inviteId: invite.id,
        sourceUserId: sourceUser.id,
        targetUserId: targetUser.id,
      });
      const admin = await userFactory.create('active', { role: UserRole.USER });

      // Act
      const query = `
        mutation DeleteContact ($contactId: Int!) {
          deleteContact(contactId: $contactId) {
            id
          }
        }
      `;

      const variables = {
        contactId: contact.id,
      };

      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, { code: 'FORBIDDEN', status: undefined });
      await expectContactIsActive(contact, { invite, sourceUser, targetUser });
      await expectContactIsActive(reverseContact, {
        invite,
        sourceUser: targetUser,
        targetUser: sourceUser,
      });
      await expectInviteAccepted(invite, { invitee, inviter });
      await expectNoActiveUserBlock(sourceUser, targetUser);
      await expectNoActiveUserBlock(targetUser, sourceUser);
    });

    it('should not be possible to delete deleted contact', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      const invite = await inviteFactory.create('accepted', {
        inviteeId: invitee.id,
        inviterId: inviter.id,
      });
      const sourceUser = invitee;
      const targetUser = inviter;
      const [contact, reverseContact] = await contactFactory.createRemovedPair({
        inviteId: invite.id,
        sourceUserId: sourceUser.id,
        targetUserId: targetUser.id,
      });

      // Act
      const query = `
        mutation DeleteContact ($contactId: Int!) {
          deleteContact(contactId: $contactId) {
            id
          }
        }
      `;

      const variables = {
        contactId: contact.id,
      };

      const { accessToken } = await authService.authenticateUser(sourceUser);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.CONTACT_ALREADY_REMOVED,
        status: 'BAD_REQUEST',
      });
      await expectContactIsRemoved(contact, { invite, sourceUser, targetUser });
      await expectContactIsRemoved(reverseContact, {
        invite,
        sourceUser: targetUser,
        targetUser: sourceUser,
      });
      await expectInviteAccepted(invite, { invitee, inviter });
      await expectNoActiveUserBlock(sourceUser, targetUser);
      await expectNoActiveUserBlock(targetUser, sourceUser);
    });
  });

  describe('block user', () => {
    it('should be possible to block user', async () => {});
    it('should not be possible to block self', async () => {});
    it('should not be possible to block blocked user', async () => {});
  });

  describe('unblock user', () => {
    it('should be possible to unblock blocked user', async () => {});
    it('should not be possible to unblock user, which was not blocked', async () => {});
    it('should not be possible to unblock user, which was blocked by other user', async () => {});
  });

  function expectResponseSuccess(response: any) {
    expect(response.status).toBe(200);
    expect(response.body?.errors).toBeUndefined();
    expect(response.body?.data).toBeDefined();
  }

  function expectResponseError(response, { code, status }: { code: string; status: string }) {
    expect(response.status).toBe(200);
    expect(response.body?.errors).toBeDefined();
    expect(response.body?.errors?.[0]?.code).toBe(code);
    expect(response.body?.errors?.[0]?.status).toBe(status);
  }

  async function expectInvitePending(inviteId: number, { inviter, invitee }) {
    const invite = await prisma.invite.findUnique({
      where: { id: inviteId },
    });

    expect(invite).toBeDefined();
    expect(invite.id).toBe(inviteId);
    expect(invite.inviteeId).toBe(invitee.id);
    expect(invite.inviterId).toBe(inviter.id);
    expect(invite.status).toBe(InviteStatus.PENDING);
    expect(invite.reactedAt).toBeNull();
  }

  async function expectInviteAccepted(
    invite: Invite,
    { invitee, inviter }: { invitee: User; inviter: User },
  ) {
    const updatedInvite = await prisma.invite.findUnique({
      where: { id: invite.id },
    });

    expect(updatedInvite).toBeDefined();
    expect(updatedInvite.id).toBe(invite.id);
    expect(updatedInvite.inviteeId).toBe(invitee.id);
    expect(updatedInvite.inviterId).toBe(inviter.id);
    expect(updatedInvite.status).toBe(InviteStatus.ACCEPTED);
    expect(updatedInvite.reactedAt).toEqual(expect.any(Date));
  }

  async function expectInviteRejected(
    invite: Invite,
    { invitee, inviter }: { invitee: User; inviter: User },
  ) {
    const updatedInvite = await prisma.invite.findUnique({
      where: { id: invite.id },
    });

    expect(updatedInvite).toBeDefined();
    expect(updatedInvite.id).toBe(invite.id);
    expect(updatedInvite.inviteeId).toBe(invitee.id);
    expect(updatedInvite.inviterId).toBe(inviter.id);
    expect(updatedInvite.status).toBe(InviteStatus.REJECTED);
    expect(updatedInvite.reactedAt).toEqual(expect.any(Date));
  }

  async function expectActiveContactPairExists(
    user1: User,
    user2: User,
    { invite }: { invite: Invite },
  ) {
    const contact1 = await prisma.contact.findFirst({
      where: {
        inviteId: invite.id,
        removedAt: null,
        sourceUserId: user1.id,
        targetUserId: user2.id,
      },
    });

    const contact2 = await prisma.contact.findFirst({
      where: {
        inviteId: invite.id,
        removedAt: null,
        sourceUserId: user2.id,
        targetUserId: user1.id,
      },
    });

    expect(contact1).toBeDefined();
    expect(contact2).toBeDefined();
  }

  async function expectActiveContactPairNotExists(
    user1: User,
    user2: User,
    { invite }: { invite: Invite },
  ) {
    const contact1 = await prisma.contact.findFirst({
      where: {
        inviteId: invite.id,
        removedAt: null,
        sourceUserId: user1.id,
        targetUserId: user2.id,
      },
    });

    const contact2 = await prisma.contact.findFirst({
      where: {
        inviteId: invite.id,
        removedAt: null,
        sourceUserId: user2.id,
        targetUserId: user1.id,
      },
    });

    expect(contact1).toBeNull();
    expect(contact2).toBeNull();
  }

  async function expectActiveUserBlock(blocker: User, blocked: User) {
    const userBlock = await prisma.userBlock.findFirst({
      where: {
        blockedId: blocked.id,
        blockerId: blocker.id,
        removedAt: null,
      },
    });

    expect(userBlock).toBeDefined();
    expect(userBlock.removedByUserId).toBeNull();
  }

  async function expectNoActiveUserBlock(blocker: User, blocked: User) {
    const userBlock = await prisma.userBlock.findFirst({
      where: {
        blockedId: blocked.id,
        blockerId: blocker.id,
        removedAt: null,
      },
    });

    expect(userBlock).toBeNull();
  }

  async function expectContactIsActive(
    contact: Contact,
    { sourceUser, targetUser, invite }: { sourceUser: User; targetUser: User; invite: Invite },
  ) {
    const updatedContact = await prisma.contact.findUnique({
      where: { id: contact.id },
    });

    expect(updatedContact).toBeDefined();
    expect(updatedContact.id).toBe(contact.id);
    expect(updatedContact.sourceUserId).toBe(sourceUser.id);
    expect(updatedContact.targetUserId).toBe(targetUser.id);
    expect(updatedContact.inviteId).toBe(invite.id);
    expect(updatedContact.removedAt).toBeNull();
    expect(updatedContact.removedByUserId).toBeNull();
  }

  async function expectContactIsRemoved(
    contact: Contact,
    { sourceUser, targetUser, invite }: { sourceUser: User; targetUser: User; invite: Invite },
  ) {
    const updatedContact = await prisma.contact.findUnique({
      where: { id: contact.id },
    });

    expect(updatedContact).toBeDefined();
    expect(updatedContact.id).toBe(contact.id);
    expect(updatedContact.sourceUserId).toBe(sourceUser.id);
    expect(updatedContact.targetUserId).toBe(targetUser.id);
    expect(updatedContact.inviteId).toBe(invite.id);
    expect(updatedContact.removedAt).toEqual(expect.any(Date));
    expect(updatedContact.removedByUserId).not.toBeNull();
  }
});
