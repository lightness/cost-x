import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { ApplicationErrorCode } from '../src/common/error/coded-application.error';
import { configureApp } from '../src/configure-app';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { PaymentModule } from '../src/payment/payment.module';
import { UserRole } from '../src/user/entity/user-role.enum';
import { WorkspacePermission } from '../generated/prisma/client';
import { FactoryModule } from './factory/factory.module';
import { ItemFactoryService } from './factory/item-factory.service';
import { PaymentFactoryService } from './factory/payment-factory.service';
import { UserFactoryService } from './factory/user-factory.service';
import { WorkspaceFactoryService } from './factory/workspace-factory.service';
import { WorkspaceMemberFactoryService } from './factory/workspace-member-factory.service';
import { TestGraphqlModule } from './graphql/test-graphql.module';
import { TestConfigModule } from './test-config.module';

const paymentQuery = `
  query Payment($id: Int!) {
    payment(id: $id) {
      id
      cost
      currency
    }
  }
`;

const paymentsQuery = `
  query Payments($itemId: Int!) {
    payments(itemId: $itemId) {
      id
    }
  }
`;

const createPaymentMutation = `
  mutation CreatePayment($itemId: Int!, $dto: PaymentInDto!) {
    createPayment(itemId: $itemId, dto: $dto) {
      id
      cost
      currency
    }
  }
`;

const updatePaymentMutation = `
  mutation UpdatePayment($paymentId: Int!, $dto: PaymentInDto!) {
    updatePayment(paymentId: $paymentId, dto: $dto) {
      id
      cost
      currency
    }
  }
`;

const deletePaymentMutation = `
  mutation DeletePayment($paymentId: Int!) {
    deletePayment(paymentId: $paymentId)
  }
`;

const PAYMENT_DTO = { cost: '10.00', currency: 'USD', date: '2024-01-01' };

describe('Payment E2E', () => {
  let moduleRef: TestingModule;
  let app: NestApplication;
  let authService: AuthService;
  let userFactory: UserFactoryService;
  let workspaceFactory: WorkspaceFactoryService;
  let itemFactory: ItemFactoryService;
  let paymentFactory: PaymentFactoryService;
  let workspaceMemberFactory: WorkspaceMemberFactoryService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [TestConfigModule, TestGraphqlModule, FactoryModule, PaymentModule, GraphqlModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    authService = moduleRef.get(AuthService);
    userFactory = moduleRef.get(UserFactoryService);
    workspaceFactory = moduleRef.get(WorkspaceFactoryService);
    itemFactory = moduleRef.get(ItemFactoryService);
    paymentFactory = moduleRef.get(PaymentFactoryService);
    workspaceMemberFactory = moduleRef.get(WorkspaceMemberFactoryService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('payment', () => {
    it('should return payment when workspace owner', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create(user.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);

      const { accessToken } = await authService.authenticateUser(user);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: paymentQuery, variables: { id: payment.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.payment.id).toBe(payment.id);
    });

    it('should not return payment when not workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const other = await userFactory.create('active');

      const { accessToken } = await authService.authenticateUser(other);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: paymentQuery, variables: { id: payment.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not return payment when not authenticated', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: paymentQuery, variables: { id: payment.id } })
        .set('Content-Type', 'application/json');

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should return payment when admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });

      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: paymentQuery, variables: { id: payment.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.payment.id).toBe(payment.id);
    });
  });

  describe('payments', () => {
    it('should return payments when workspace owner', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create(user.id);
      const item = await itemFactory.create(workspace.id);

      const { accessToken } = await authService.authenticateUser(user);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: paymentsQuery, variables: { itemId: item.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
    });

    it('should not return payments when not workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const other = await userFactory.create('active');

      const { accessToken } = await authService.authenticateUser(other);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: paymentsQuery, variables: { itemId: item.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not return payments when not authenticated', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: paymentsQuery, variables: { itemId: item.id } })
        .set('Content-Type', 'application/json');

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should return payments when admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });

      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: paymentsQuery, variables: { itemId: item.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
    });
  });

  describe('createPayment', () => {
    it('should create payment when workspace owner', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create(user.id);
      const item = await itemFactory.create(workspace.id);

      const { accessToken } = await authService.authenticateUser(user);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: createPaymentMutation, variables: { itemId: item.id, dto: PAYMENT_DTO } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.createPayment.currency).toBe('USD');
    });

    it('should not create payment when non-member', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const stranger = await userFactory.create('active');

      const { accessToken } = await authService.authenticateUser(stranger);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: createPaymentMutation, variables: { itemId: item.id, dto: PAYMENT_DTO } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should create payment when workspace member with CREATE_PAYMENT permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const member = await userFactory.create('active');
      await workspaceMemberFactory.create(workspace.id, member.id);

      const { accessToken } = await authService.authenticateUser(member);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: createPaymentMutation, variables: { itemId: item.id, dto: PAYMENT_DTO } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.createPayment.currency).toBe('USD');
    });

    it('should not create payment when workspace member without CREATE_PAYMENT permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const member = await userFactory.create('active');
      await workspaceMemberFactory.create(workspace.id, member.id, { permissions: [] });

      const { accessToken } = await authService.authenticateUser(member);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: createPaymentMutation, variables: { itemId: item.id, dto: PAYMENT_DTO } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not create payment when not authenticated', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: createPaymentMutation, variables: { itemId: item.id, dto: PAYMENT_DTO } })
        .set('Content-Type', 'application/json');

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should create payment when admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });

      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: createPaymentMutation, variables: { itemId: item.id, dto: PAYMENT_DTO } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.createPayment.currency).toBe('USD');
    });
  });

  describe('updatePayment', () => {
    it('should update payment when workspace owner', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create(user.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);

      const { accessToken } = await authService.authenticateUser(user);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updatePaymentMutation, variables: { paymentId: payment.id, dto: { ...PAYMENT_DTO, currency: 'EUR' } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.updatePayment.currency).toBe('EUR');
    });

    it('should not update payment when non-member', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const stranger = await userFactory.create('active');

      const { accessToken } = await authService.authenticateUser(stranger);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updatePaymentMutation, variables: { paymentId: payment.id, dto: PAYMENT_DTO } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should update payment when workspace member with UPDATE_PAYMENT permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const member = await userFactory.create('active');
      await workspaceMemberFactory.create(workspace.id, member.id);

      const { accessToken } = await authService.authenticateUser(member);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updatePaymentMutation, variables: { paymentId: payment.id, dto: { ...PAYMENT_DTO, currency: 'EUR' } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.updatePayment.currency).toBe('EUR');
    });

    it('should not update payment when workspace member without UPDATE_PAYMENT permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const member = await userFactory.create('active');
      await workspaceMemberFactory.create(workspace.id, member.id, { permissions: [] });

      const { accessToken } = await authService.authenticateUser(member);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updatePaymentMutation, variables: { paymentId: payment.id, dto: PAYMENT_DTO } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not update payment when not authenticated', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updatePaymentMutation, variables: { paymentId: payment.id, dto: PAYMENT_DTO } })
        .set('Content-Type', 'application/json');

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should update payment when admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });

      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: updatePaymentMutation, variables: { paymentId: payment.id, dto: { ...PAYMENT_DTO, currency: 'EUR' } } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.updatePayment.currency).toBe('EUR');
    });
  });

  describe('deletePayment', () => {
    it('should delete payment when workspace owner', async () => {
      const user = await userFactory.create('active');
      const workspace = await workspaceFactory.create(user.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);

      const { accessToken } = await authService.authenticateUser(user);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: deletePaymentMutation, variables: { paymentId: payment.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.deletePayment).toBe(true);
    });

    it('should not delete payment when non-member', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const stranger = await userFactory.create('active');

      const { accessToken } = await authService.authenticateUser(stranger);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: deletePaymentMutation, variables: { paymentId: payment.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should delete payment when workspace member with DELETE_PAYMENT permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const member = await userFactory.create('active');
      await workspaceMemberFactory.create(workspace.id, member.id);

      const { accessToken } = await authService.authenticateUser(member);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: deletePaymentMutation, variables: { paymentId: payment.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.deletePayment).toBe(true);
    });

    it('should not delete payment when workspace member without DELETE_PAYMENT permission', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const member = await userFactory.create('active');
      await workspaceMemberFactory.create(workspace.id, member.id, { permissions: [] });

      const { accessToken } = await authService.authenticateUser(member);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: deletePaymentMutation, variables: { paymentId: payment.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should not delete payment when not authenticated', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: deletePaymentMutation, variables: { paymentId: payment.id } })
        .set('Content-Type', 'application/json');

      expectResponseError(response, { code: ApplicationErrorCode.NO_ACCESS, status: 'FORBIDDEN' });
    });

    it('should delete payment when admin', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const admin = await userFactory.create('active', { role: UserRole.ADMIN });

      const { accessToken } = await authService.authenticateUser(admin);

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: deletePaymentMutation, variables: { paymentId: payment.id } })
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${accessToken}`);

      expectResponseSuccess(response);
      expect(response.body.data.deletePayment).toBe(true);
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
