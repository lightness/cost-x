import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { ApplicationErrorCode } from '../src/common/error/coded-application.error';
import { configureApp } from '../src/configure-app';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { PaymentModule } from '../src/payment/payment.module';
import { UserRole } from '../src/user/entity/user-role.enum';
import { FactoryModule } from './factory/factory.module';
import { ItemFactoryService } from './factory/item-factory.service';
import { PaymentFactoryService } from './factory/payment-factory.service';
import { UserFactoryService } from './factory/user-factory.service';
import { WorkspaceFactoryService } from './factory/workspace-factory.service';
import { TestGraphqlModule } from './graphql/test-graphql.module';
import { TestConfigModule } from './test-config.module';

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
  });

  afterAll(async () => {
    await app.close();
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

    it('should not create payment when not workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const other = await userFactory.create('active');

      const { accessToken } = await authService.authenticateUser(other);

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

    it('should not update payment when not workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const other = await userFactory.create('active');

      const { accessToken } = await authService.authenticateUser(other);

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

    it('should not delete payment when not workspace owner', async () => {
      const owner = await userFactory.create('active');
      const workspace = await workspaceFactory.create(owner.id);
      const item = await itemFactory.create(workspace.id);
      const payment = await paymentFactory.create(item.id);
      const other = await userFactory.create('active');

      const { accessToken } = await authService.authenticateUser(other);

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
