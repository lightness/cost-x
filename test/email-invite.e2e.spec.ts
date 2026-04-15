import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { createHash } from 'node:crypto';
import { v4 as uuid } from 'uuid';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { ApplicationErrorCode } from '../src/common/error/coded-application.error';
import { configureApp } from '../src/configure-app';
import { ContactModule } from '../src/contact/contact.module';
import { InviteStatus } from '../src/contact/entity/invite-status.enum';
import { EmailInviteJwtPayload } from '../src/contact/interfaces';
import { EMAIL_INVITE_TOKEN_SERVICE } from '../src/contact/symbols';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { MailService } from '../src/mail/mail.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { TokenService } from '../src/token/token.service';
import { FactoryModule } from './factory/factory.module';
import { InviteFactoryService } from './factory/invite-factory.service';
import { UserBlockFactoryService } from './factory/user-block-factory.service';
import { UserFactoryService } from './factory/user-factory.service';
import { TestGraphqlModule } from './graphql/test-graphql.module';
import { TestConfigModule } from './test-config.module';

const CREATE_INVITE_BY_EMAIL = `
  mutation CreateInviteByEmail($dto: CreateInviteByEmailInDto!) {
    createInviteByEmail(dto: $dto) {
      id
    }
  }
`;

describe('Email Invite E2E', () => {
  let moduleRef: TestingModule;
  let app: NestApplication;
  let authService: AuthService;
  let prisma: PrismaService;
  let userFactory: UserFactoryService;
  let inviteFactory: InviteFactoryService;
  let userBlockFactory: UserBlockFactoryService;
  let tokenService: TokenService<EmailInviteJwtPayload>;
  let mockMailService: { sendEmailInvite: jest.Mock };

  beforeAll(async () => {
    mockMailService = { sendEmailInvite: jest.fn().mockResolvedValue(undefined) };

    moduleRef = await Test.createTestingModule({
      imports: [TestConfigModule, TestGraphqlModule, FactoryModule, ContactModule, GraphqlModule],
    })
      .overrideProvider(MailService)
      .useValue(mockMailService)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    authService = moduleRef.get(AuthService);
    prisma = moduleRef.get(PrismaService);
    userFactory = moduleRef.get(UserFactoryService);
    inviteFactory = moduleRef.get(InviteFactoryService);
    userBlockFactory = moduleRef.get(UserBlockFactoryService);
    tokenService = moduleRef.get<TokenService<EmailInviteJwtPayload>>(EMAIL_INVITE_TOKEN_SERVICE);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockMailService.sendEmailInvite.mockClear();
  });

  async function setupEmailInvite(inviterUserId: number, inviteeEmail: string) {
    const email = inviteeEmail.toLowerCase();
    const hash = createHash('sha256').update(`${inviterUserId}:${email}`).digest('hex');
    const ghostEmail = `${hash}@placeholder.internal`;
    const confirmEmailTempCode = uuid();
    const resetPasswordTempCode = uuid();

    const ghost = await userFactory.create('email_not_verified', {
      confirmEmailTempCode,
      email: ghostEmail,
      resetPasswordTempCode,
    });

    const invite = await inviteFactory.create('pending', {
      inviteeId: ghost.id,
      inviterId: inviterUserId,
    });

    const token = await tokenService.createToken({
      confirmEmailTempCode,
      id: ghost.id,
      inviteeEmail: email,
      inviteId: invite.id,
      resetPasswordTempCode,
    });

    return { ghost, invite, token };
  }

  describe('createInviteByEmail', () => {
    const getInviteId = (response) => response.body?.data?.createInviteByEmail?.id;

    it('should create pending invite with ghost user for a new email', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const inviteeEmail = userFactory.generateEmail();
      const { accessToken } = await authService.authenticateUser(inviter);

      // Act
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: CREATE_INVITE_BY_EMAIL,
          variables: { dto: { inviteeEmail, inviterUserId: inviter.id } },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);

      const inviteId = getInviteId(response);
      const invite = await prisma.invite.findUnique({ where: { id: inviteId } });

      expect(invite).toBeDefined();
      expect(invite.inviterId).toBe(inviter.id);
      expect(invite.status).toBe(InviteStatus.PENDING);
      expect(invite.reactedAt).toBeNull();

      const ghost = await prisma.user.findUnique({ where: { id: invite.inviteeId } });

      expect(ghost).toBeDefined();
      expect(ghost.email).toMatch(/@placeholder\.internal$/);
      expect(ghost.confirmEmailTempCode).not.toBeNull();
      expect(ghost.resetPasswordTempCode).not.toBeNull();

      expect(mockMailService.sendEmailInvite).toHaveBeenCalledTimes(1);
    });

    it('should create pending invite when invitee email belongs to an existing user', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const existingUser = await userFactory.create('active');
      const { accessToken } = await authService.authenticateUser(inviter);

      // Act
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: CREATE_INVITE_BY_EMAIL,
          variables: { dto: { inviteeEmail: existingUser.email, inviterUserId: inviter.id } },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseSuccess(response);

      const inviteId = getInviteId(response);
      const invite = await prisma.invite.findUnique({ where: { id: inviteId } });

      expect(invite).toBeDefined();
      expect(invite.inviterId).toBe(inviter.id);
      expect(invite.status).toBe(InviteStatus.PENDING);
      expect(invite.reactedAt).toBeNull();

      expect(mockMailService.sendEmailInvite).toHaveBeenCalledTimes(1);
    });

    it('should not create duplicate invite to the same email', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const inviteeEmail = userFactory.generateEmail();
      const { accessToken } = await authService.authenticateUser(inviter);

      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: CREATE_INVITE_BY_EMAIL,
          variables: { dto: { inviteeEmail, inviterUserId: inviter.id } },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Act
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: CREATE_INVITE_BY_EMAIL,
          variables: { dto: { inviteeEmail, inviterUserId: inviter.id } },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.INVITER_ALREADY_SEND_INVITE,
        status: 'BAD_REQUEST',
      });
    });

    it('should normalize email (strip + alias) and detect duplicate invite', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const baseEmail = userFactory.generateEmail();
      const [local, domain] = baseEmail.split('@');
      const aliasEmail = `${local}+alias@${domain}`;
      const { accessToken } = await authService.authenticateUser(inviter);

      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: CREATE_INVITE_BY_EMAIL,
          variables: { dto: { inviteeEmail: baseEmail, inviterUserId: inviter.id } },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Act — invite using the alias form of the same email
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: CREATE_INVITE_BY_EMAIL,
          variables: { dto: { inviteeEmail: aliasEmail, inviterUserId: inviter.id } },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.INVITER_ALREADY_SEND_INVITE,
        status: 'BAD_REQUEST',
      });
    });

    it('should not create invite when invitee has blocked the inviter', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      await userBlockFactory.create('active', { blockedId: inviter.id, blockerId: invitee.id });
      const { accessToken } = await authService.authenticateUser(inviter);

      // Act
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: CREATE_INVITE_BY_EMAIL,
          variables: { dto: { inviteeEmail: invitee.email, inviterUserId: inviter.id } },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.INVITEE_BLOCKED_INVITER,
        status: 'BAD_REQUEST',
      });

      expect(mockMailService.sendEmailInvite).not.toHaveBeenCalled();
    });

    it('should not create invite when inviter has blocked the invitee', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const invitee = await userFactory.create('active');
      await userBlockFactory.create('active', { blockedId: invitee.id, blockerId: inviter.id });
      const { accessToken } = await authService.authenticateUser(inviter);

      // Act
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: CREATE_INVITE_BY_EMAIL,
          variables: { dto: { inviteeEmail: invitee.email, inviterUserId: inviter.id } },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.INVITER_BLOCKED_INVITEE,
        status: 'BAD_REQUEST',
      });

      expect(mockMailService.sendEmailInvite).not.toHaveBeenCalled();
    });

    it('should not be possible to create invite by email as a different user', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const otherUser = await userFactory.create('active');
      const inviteeEmail = userFactory.generateEmail();
      const { accessToken } = await authService.authenticateUser(otherUser);

      // Act
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: CREATE_INVITE_BY_EMAIL,
          variables: { dto: { inviteeEmail, inviterUserId: inviter.id } },
        })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expectResponseError(response, {
        code: ApplicationErrorCode.NO_ACCESS,
        status: 'FORBIDDEN',
      });

      expect(mockMailService.sendEmailInvite).not.toHaveBeenCalled();
    });
  });

  describe('acceptEmailInvite', () => {
    const acceptEmailInvite = (token: string) =>
      request(app.getHttpServer()).get('/email-invite/accept').query({ token });

    it('should accept invite and convert ghost user into real user', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const inviteeEmail = userFactory.generateEmail();
      const { invite, token } = await setupEmailInvite(inviter.id, inviteeEmail);

      // Act
      const response = await acceptEmailInvite(token);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.resetPasswordToken).toEqual(expect.any(String));

      const updatedInvite = await prisma.invite.findUnique({ where: { id: invite.id } });

      expect(updatedInvite.status).toBe(InviteStatus.ACCEPTED);
      expect(updatedInvite.reactedAt).toEqual(expect.any(Date));

      const user = await prisma.user.findUnique({ where: { id: updatedInvite.inviteeId } });

      expect(user.email).toBe(inviteeEmail.toLowerCase());
      expect(user.confirmEmailTempCode).toBeNull();

      await expectActiveContactPairExists(inviter.id, updatedInvite.inviteeId, invite.id);
    });

    it('should accept invite and link to existing user when email is already registered', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const existingUser = await userFactory.create('active');
      const { invite, ghost, token } = await setupEmailInvite(inviter.id, existingUser.email);

      // Act
      const response = await acceptEmailInvite(token);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.resetPasswordToken).toEqual(expect.any(String));

      const updatedInvite = await prisma.invite.findUnique({ where: { id: invite.id } });

      expect(updatedInvite.status).toBe(InviteStatus.ACCEPTED);
      expect(updatedInvite.reactedAt).toEqual(expect.any(Date));
      expect(updatedInvite.inviteeId).toBe(existingUser.id);

      const deletedGhost = await prisma.user.findUnique({ where: { id: ghost.id } });

      expect(deletedGhost).toBeNull();

      await expectActiveContactPairExists(inviter.id, existingUser.id, invite.id);
    });

    it('should fail when token is invalid', async () => {
      // Act
      const response = await acceptEmailInvite('invalid-token');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.code).toBe(ApplicationErrorCode.EMAIL_INVITE_TOKEN_INVALID);
    });

    it('should fail when invite is no longer pending', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const inviteeEmail = userFactory.generateEmail();
      const { invite, token } = await setupEmailInvite(inviter.id, inviteeEmail);

      await prisma.invite.update({
        data: { reactedAt: new Date(), status: InviteStatus.REJECTED },
        where: { id: invite.id },
      });

      // Act
      const response = await acceptEmailInvite(token);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.code).toBe(ApplicationErrorCode.EMAIL_INVITE_NO_LONGER_VALID);
    });
  });

  describe('rejectEmailInvite', () => {
    const rejectEmailInvite = (token: string) =>
      request(app.getHttpServer()).get('/email-invite/reject').query({ token });

    it('should reject invite and delete ghost user', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const inviteeEmail = userFactory.generateEmail();
      const { invite, ghost, token } = await setupEmailInvite(inviter.id, inviteeEmail);

      // Act
      const response = await rejectEmailInvite(token);

      // Assert
      expect(response.status).toBe(200);

      const deletedInvite = await prisma.invite.findUnique({ where: { id: invite.id } });

      expect(deletedInvite).toBeNull();

      const deletedGhost = await prisma.user.findUnique({ where: { id: ghost.id } });

      expect(deletedGhost).toBeNull();
    });

    it('should fail when token is invalid', async () => {
      // Act
      const response = await rejectEmailInvite('invalid-token');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.code).toBe(ApplicationErrorCode.EMAIL_INVITE_TOKEN_INVALID);
    });

    it('should fail when invite is no longer pending', async () => {
      // Assume
      const inviter = await userFactory.create('active');
      const inviteeEmail = userFactory.generateEmail();
      const { token } = await setupEmailInvite(inviter.id, inviteeEmail);

      await rejectEmailInvite(token);

      // Act — reject again with the same token (ghost already deleted)
      const response = await rejectEmailInvite(token);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.code).toBe(ApplicationErrorCode.EMAIL_INVITE_TOKEN_INVALID);
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

  async function expectActiveContactPairExists(userId1: number, userId2: number, inviteId: number) {
    const contact1 = await prisma.contact.findFirst({
      where: { inviteId, removedAt: null, sourceUserId: userId1, targetUserId: userId2 },
    });

    const contact2 = await prisma.contact.findFirst({
      where: { inviteId, removedAt: null, sourceUserId: userId2, targetUserId: userId1 },
    });

    expect(contact1).not.toBeNull();
    expect(contact2).not.toBeNull();
  }
});
