import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { configureApp } from '../src/configure-app';
import { ContactModule } from '../src/contact/contact.module';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { FactoryModule } from './factory/factory.module';
import { UserFactoryService } from './factory/user-factory.service';
import { TestConfigModule } from './test-config.module';

describe('Contact E2E', () => {
  let moduleRef: TestingModule;
  let app: NestApplication;
  let userFactory: UserFactoryService;
  let authService: AuthService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TestConfigModule, FactoryModule, ContactModule, GraphqlModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    userFactory = moduleRef.get(UserFactoryService);
    authService = moduleRef.get(AuthService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('invite', () => {
    it('should be possible to invite user', async () => {
      const inviter = await userFactory.createActive();
      const invitee = await userFactory.createActive();

      const query = `
        mutation CreateInvite ($dto: CreateInviteInDto!) {
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

      expect(response.status).toBe(200);
      expect(response.body?.errors).toBeUndefined();
      expect(response.body?.data?.createInvite?.id).toEqual(expect.any(Number));
    });

    it('should not be possible to invite user, if pending invite exists', async () => {});
    it('should be possible to invite user, if non-pending invite exists', async () => {});
    it('should not be possible to invite user, if pending invite exists (reverse)', async () => {});
    it('should be possible to invite user, if non-pending invite exists (reverse)', async () => {});
    it('should not be possible to invite user, if contact exists', async () => {});
    it('should be possible to invite user, if removed contact exists', async () => {});
    it('should not be possible to invite user, if invitee blocked inviter', async () => {});
    it('should be possible to invite user, if invitee unblocked inviter', async () => {});
    it('should not be possible to invite user, if inviter blocked invitee', async () => {});
    it('should be possible to invite user, if inviter unblocked invitee', async () => {});
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
