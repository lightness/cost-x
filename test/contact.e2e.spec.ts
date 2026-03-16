import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { InviteStatus } from '../generated/prisma/enums';
import { AuthService } from '../src/auth/auth.service';
import { configureApp } from '../src/configure-app';
import { ContactModule } from '../src/contact/contact.module';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { PrismaService } from '../src/prisma/prisma.service';
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
      expect(response.status).toBe(200);
      expect(response.body?.errors).toBeUndefined();
      expect(response.body?.data?.createInvite?.id).toEqual(expect.any(Number));

      const invite = await prisma.invite.findUnique({
        where: { id: response.body.data.createInvite.id },
      });

      expect(invite).toBeDefined();
      expect(invite.id).toBe(response.body.data.createInvite.id);
      expect(invite.inviteeId).toBe(invitee.id);
      expect(invite.inviterId).toBe(inviter.id);
      expect(invite.status).toBe(InviteStatus.PENDING);
      expect(invite.reactedAt).toBeNull();
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
      expect(response.status).toBe(200);
      expect(response.body?.errors).toBeDefined();
      expect(response.body?.errors?.[0]?.code).toBe('inviter_already_send_invite');
      expect(response.body?.errors?.[0]?.status).toBe('BAD_REQUEST');
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
      expect(response.status).toBe(200);
      expect(response.body?.errors).toBeUndefined();
      expect(response.body?.data?.createInvite?.id).toEqual(expect.any(Number));

      const invite = await prisma.invite.findUnique({
        where: { id: response.body.data.createInvite.id },
      });

      expect(invite).toBeDefined();
      expect(invite.id).toBe(response.body.data.createInvite.id);
      expect(invite.inviteeId).toBe(invitee.id);
      expect(invite.inviterId).toBe(inviter.id);
      expect(invite.status).toBe(InviteStatus.PENDING);
      expect(invite.reactedAt).toBeNull();
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
      expect(response.status).toBe(200);
      expect(response.body?.errors).toBeDefined();
      expect(response.body?.errors?.[0]?.code).toBe('invitee_already_send_invite');
      expect(response.body?.errors?.[0]?.status).toBe('BAD_REQUEST');
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
      expect(response.status).toBe(200);
      expect(response.body?.errors).toBeUndefined();
      expect(response.body?.data?.createInvite?.id).toEqual(expect.any(Number));

      const invite = await prisma.invite.findUnique({
        where: { id: response.body.data.createInvite.id },
      });

      expect(invite).toBeDefined();
      expect(invite.id).toBe(response.body.data.createInvite.id);
      expect(invite.inviteeId).toBe(invitee.id);
      expect(invite.inviterId).toBe(inviter.id);
      expect(invite.status).toBe(InviteStatus.PENDING);
      expect(invite.reactedAt).toBeNull();
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
      expect(response.status).toBe(200);
      expect(response.body?.errors).toBeDefined();
      expect(response.body?.errors?.[0]?.code).toBe('contact_already_exists');
      expect(response.body?.errors?.[0]?.status).toBe('BAD_REQUEST');
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
      expect(response.status).toBe(200);
      expect(response.body?.errors).toBeUndefined();
      expect(response.body?.data?.createInvite?.id).toEqual(expect.any(Number));

      const newInvite = await prisma.invite.findUnique({
        where: { id: response.body.data.createInvite.id },
      });

      expect(newInvite).toBeDefined();
      expect(newInvite.id).toBe(response.body.data.createInvite.id);
      expect(newInvite.inviteeId).toBe(invitee.id);
      expect(newInvite.inviterId).toBe(inviter.id);
      expect(newInvite.status).toBe(InviteStatus.PENDING);
      expect(newInvite.reactedAt).toBeNull();
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
      expect(response.status).toBe(200);
      expect(response.body?.errors).toBeDefined();
      expect(response.body?.errors?.[0]?.code).toBe('invitee_blocked_inviter');
      expect(response.body?.errors?.[0]?.status).toBe('BAD_REQUEST');
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
      expect(response.status).toBe(200);
      expect(response.body?.errors).toBeUndefined();
      expect(response.body?.data?.createInvite?.id).toEqual(expect.any(Number));

      const newInvite = await prisma.invite.findUnique({
        where: { id: response.body.data.createInvite.id },
      });

      expect(newInvite).toBeDefined();
      expect(newInvite.id).toBe(response.body.data.createInvite.id);
      expect(newInvite.inviteeId).toBe(invitee.id);
      expect(newInvite.inviterId).toBe(inviter.id);
      expect(newInvite.status).toBe(InviteStatus.PENDING);
      expect(newInvite.reactedAt).toBeNull();
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
      expect(response.status).toBe(200);
      expect(response.body?.errors).toBeDefined();
      expect(response.body?.errors?.[0]?.code).toBe('inviter_blocked_invitee');
      expect(response.body?.errors?.[0]?.status).toBe('BAD_REQUEST');
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
      expect(response.status).toBe(200);
      expect(response.body?.errors).toBeUndefined();
      expect(response.body?.data?.createInvite?.id).toEqual(expect.any(Number));

      const newInvite = await prisma.invite.findUnique({
        where: { id: response.body.data.createInvite.id },
      });

      expect(newInvite).toBeDefined();
      expect(newInvite.id).toBe(response.body.data.createInvite.id);
      expect(newInvite.inviteeId).toBe(invitee.id);
      expect(newInvite.inviterId).toBe(inviter.id);
      expect(newInvite.status).toBe(InviteStatus.PENDING);
      expect(newInvite.reactedAt).toBeNull();
    });
  });

  describe('accept invite', () => {
    it('should be possible for invitee to accept invite', async () => {});
    it('should not be possible for inviter to accept invite', async () => {});
    it('should not be possible to accept invite, if contact exists', async () => {});
    it('should be possible to accept invite, if removed contact exists', async () => {});
    it('should not be possible to invite user, if invitee blocked inviter', async () => {});
    it('should be possible to invite user, if invitee unblocked inviter', async () => {});
    it('should not be possible to invite user, if inviter blocked invitee', async () => {});
    it('should be possible to invite user, if inviter unblocked invitee', async () => {});
    it('should create contact pair on invite accept', async () => {});
  });

  describe('reject invite', () => {
    it('should be possible for invitee to reject invite', async () => {});
    it('should not be possible for inviter to reject invite', async () => {});
    it('should not be possible to reject invite, if contact exists', async () => {});
    it('should be possible to reject invite, if removed contact exists', async () => {});
    it('should not be possible to invite user, if invitee blocked inviter', async () => {});
    it('should be possible to invite user, if invitee unblocked inviter', async () => {});
    it('should not be possible to invite user, if inviter blocked invitee', async () => {});
    it('should be possible to invite user, if inviter unblocked invitee', async () => {});
  });

  describe('reject invite and block', () => {
    it('should be possible for invitee to reject invite and block inviter', async () => {});
    it('should not be possible for inviter to reject invite', async () => {});
    it('should not be possible to reject invite, if contact exists', async () => {});
    it('should be possible to reject invite, if removed contact exists', async () => {});
    it('should not be possible to invite user, if invitee blocked inviter', async () => {});
    it('should be possible to invite user, if invitee unblocked inviter', async () => {});
    it('should not be possible to invite user, if inviter blocked invitee', async () => {});
    it('should be possible to invite user, if inviter unblocked invitee', async () => {});
    it('should block inviter for invitee', async () => {});
  });

  describe('delete contact', () => {
    it('should be possible to delete contact', async () => {});
    it(`should not be possible to delete someone else's contact`, async () => {});
    it('should not be possible to delete deleted contact', async () => {});
  });

  describe('block user', () => {
    it('should be possible to block user', async () => {});
    it('should not be possible to block self', async () => {});
    it('should not be possible to block blocked user', async () => {});
  });

  describe('unblock user', () => {
    it('should be possible to unblock blocked user', async () => {});
    it('should not be possible to unblock user, which was not blocked', async () => {});
  });
});
