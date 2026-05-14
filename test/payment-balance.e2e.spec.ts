import { NestApplication } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { Currency, StakeRule } from '../generated/prisma/client';
import { AuthService } from '../src/auth/auth.service';
import { configureApp } from '../src/configure-app';
import { GraphqlModule } from '../src/graphql/graphql.module';
import { ItemStakeModule } from '../src/item-stake/item-stake.module';
import { PaymentBalanceModule } from '../src/payment-balance/payment-balance.module';
import { PaymentModule } from '../src/payment/payment.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { BalanceCurrencyMode } from '../src/workspace-stake/entity/balance-currency-mode.enum';
import { WorkspaceStakeModule } from '../src/workspace-stake/workspace-stake.module';
import { WorkspaceModule } from '../src/workspace/workspace.module';
import { WorkspaceMembershipModule } from '../src/workspace-membership/workspace-membership.module';
import { FactoryModule } from './factory/factory.module';
import { ItemFactoryService } from './factory/item-factory.service';
import { PaymentFactoryService } from './factory/payment-factory.service';
import { UserFactoryService } from './factory/user-factory.service';
import { WorkspaceFactoryService } from './factory/workspace-factory.service';
import { WorkspaceMemberFactoryService } from './factory/workspace-member-factory.service';
import { TestGraphqlModule } from './graphql/test-graphql.module';
import { TestConfigModule } from './test-config.module';

const updateWorkspaceMutation = `
  mutation UpdateWorkspace($id: Int!, $dto: WorkspaceInDto!) {
    updateWorkspace(id: $id, dto: $dto) {
      id
      defaultCurrency
    }
  }
`;

const paymentWithBalanceChangesQuery = `
  query Payment($id: Int!) {
    payment(id: $id) {
      id
      balanceChanges {
        workspaceMemberId
        value
        currency
      }
    }
  }
`;

const createPaymentMutation = `
  mutation CreatePayment($itemId: Int!, $dto: PaymentInDto!) {
    createPayment(itemId: $itemId, dto: $dto) {
      id
      balanceChanges {
        workspaceMemberId
        value
        currency
      }
    }
  }
`;

const updatePaymentMutation = `
  mutation UpdatePayment($paymentId: Int!, $dto: PaymentInDto!) {
    updatePayment(paymentId: $paymentId, dto: $dto) {
      id
      balanceChanges {
        workspaceMemberId
        value
        currency
      }
    }
  }
`;

const setItemStakeRuleMutation = `
  mutation SetItemStakeRule($itemId: Int!, $stakeRule: StakeRule!) {
    setItemStakeRule(itemId: $itemId, stakeRule: $stakeRule) {
      id
      stakeRule
    }
  }
`;

const setItemStakesMutation = `
  mutation SetItemStakes($itemId: Int!, $stakes: [MemberStake!]!) {
    setItemStakes(itemId: $itemId, stakes: $stakes) {
      id
      workspaceMemberId
      value
    }
  }
`;

const updateWorkspaceBalanceCurrencyModeMutation = `
  mutation UpdateWorkspaceBalanceCurrencyMode($workspaceId: Int!, $mode: BalanceCurrencyMode!) {
    updateWorkspaceBalanceCurrencyMode(workspaceId: $workspaceId, mode: $mode) {
      id
      balanceCurrencyMode
    }
  }
`;

const removeWorkspaceMemberMutation = `
  mutation RemoveWorkspaceMember($memberId: Int!) {
    removeWorkspaceMember(memberId: $memberId) {
      id
      removedAt
    }
  }
`;

describe('Payment Balance E2E', () => {
  let moduleRef: TestingModule;
  let app: NestApplication;
  let authService: AuthService;
  let prismaService: PrismaService;
  let userFactory: UserFactoryService;
  let workspaceFactory: WorkspaceFactoryService;
  let itemFactory: ItemFactoryService;
  let paymentFactory: PaymentFactoryService;
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
        PaymentModule,
        PaymentBalanceModule,
        GraphqlModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    authService = moduleRef.get(AuthService);
    prismaService = moduleRef.get(PrismaService);
    userFactory = moduleRef.get(UserFactoryService);
    workspaceFactory = moduleRef.get(WorkspaceFactoryService);
    itemFactory = moduleRef.get(ItemFactoryService);
    paymentFactory = moduleRef.get(PaymentFactoryService);
    workspaceMemberFactory = moduleRef.get(WorkspaceMemberFactoryService);
  });

  afterAll(async () => {
    await app.close();
  });

  function gql(token: string, query: string, variables: Record<string, unknown>) {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query, variables })
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${token}`);
  }

  describe('EQUALLY stakeRule', () => {
    it('splits cost evenly among 3 members — payer +60, others −30 each on $90 payment', async () => {
      const owner = await userFactory.create();
      const user2 = await userFactory.create();
      const user3 = await userFactory.create();

      const workspace = await workspaceFactory.create({
        defaultCurrency: Currency.USD,
        ownerId: owner.id,
      });
      const ownerMember = await workspaceMemberFactory.create(workspace.id, owner.id);
      const member2 = await workspaceMemberFactory.create(workspace.id, user2.id);
      const member3 = await workspaceMemberFactory.create(workspace.id, user3.id);

      const item = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      await gql(accessToken, setItemStakeRuleMutation, {
        itemId: item.id,
        stakeRule: StakeRule.EQUALLY,
      });

      const res = await gql(accessToken, createPaymentMutation, {
        dto: { cost: '90', currency: Currency.USD, date: '2024-01-01', payerId: ownerMember.id },
        itemId: item.id,
      });

      const changes: { workspaceMemberId: number; value: string; currency: string }[] =
        res.body.data.createPayment.balanceChanges;

      const byMember = Object.fromEntries(
        changes.map((c) => [c.workspaceMemberId, Number(c.value)]),
      );

      expect(byMember[ownerMember.id]).toBeCloseTo(60, 5);
      expect(byMember[member2.id]).toBeCloseTo(-30, 5);
      expect(byMember[member3.id]).toBeCloseTo(-30, 5);
      expect(changes[0].currency).toBe(Currency.USD);
    });
  });

  describe('ALL_PAYER stakeRule', () => {
    it('all members get value 0 — payer covers everything', async () => {
      const owner = await userFactory.create();
      const user2 = await userFactory.create();

      const workspace = await workspaceFactory.create({
        defaultCurrency: Currency.USD,
        ownerId: owner.id,
      });
      const ownerMember = await workspaceMemberFactory.create(workspace.id, owner.id);
      await workspaceMemberFactory.create(workspace.id, user2.id);

      const item = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      await gql(accessToken, setItemStakeRuleMutation, {
        itemId: item.id,
        stakeRule: StakeRule.ALL_PAYER,
      });

      const res = await gql(accessToken, createPaymentMutation, {
        dto: { cost: '100', currency: Currency.USD, date: '2024-01-01', payerId: ownerMember.id },
        itemId: item.id,
      });

      const changes: { value: string }[] = res.body.data.createPayment.balanceChanges;

      for (const change of changes) {
        expect(Number(change.value)).toBeCloseTo(0, 5);
      }
    });
  });

  describe('ALL_WORKSPACE_OWNER stakeRule', () => {
    it('non-owner payer: owner gets −full cost, payer gets +full cost', async () => {
      const owner = await userFactory.create();
      const nonOwner = await userFactory.create();

      const workspace = await workspaceFactory.create({
        defaultCurrency: Currency.USD,
        ownerId: owner.id,
      });
      const ownerMember = await workspaceMemberFactory.create(workspace.id, owner.id);
      const nonOwnerMember = await workspaceMemberFactory.create(workspace.id, nonOwner.id);

      const item = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      await gql(accessToken, setItemStakeRuleMutation, {
        itemId: item.id,
        stakeRule: StakeRule.ALL_WORKSPACE_OWNER,
      });

      const res = await gql(accessToken, createPaymentMutation, {
        dto: { cost: '50', currency: Currency.USD, date: '2024-01-01', payerId: nonOwnerMember.id },
        itemId: item.id,
      });

      const changes: { workspaceMemberId: number; value: string }[] =
        res.body.data.createPayment.balanceChanges;

      const byMember = Object.fromEntries(
        changes.map((c) => [c.workspaceMemberId, Number(c.value)]),
      );

      expect(byMember[ownerMember.id]).toBeCloseTo(-50, 5);
      expect(byMember[nonOwnerMember.id]).toBeCloseTo(50, 5);
    });
  });

  describe('explicit stakes (stakeRule = null)', () => {
    it('active member missing from stakes rows is treated as stake 0', async () => {
      const owner = await userFactory.create();
      const user2 = await userFactory.create();
      const user3 = await userFactory.create();

      const workspace = await workspaceFactory.create({
        defaultCurrency: Currency.USD,
        ownerId: owner.id,
      });
      const ownerMember = await workspaceMemberFactory.create(workspace.id, owner.id);
      const member2 = await workspaceMemberFactory.create(workspace.id, user2.id);
      const member3 = await workspaceMemberFactory.create(workspace.id, user3.id);

      const item = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      // Only owner and member2 get stakes; member3 is absent → stake 0
      await gql(accessToken, setItemStakesMutation, {
        itemId: item.id,
        stakes: [
          { value: 2, workspaceMemberId: ownerMember.id },
          { value: 1, workspaceMemberId: member2.id },
          { value: 0, workspaceMemberId: member3.id },
        ],
      });

      const res = await gql(accessToken, createPaymentMutation, {
        dto: { cost: '90', currency: Currency.USD, date: '2024-01-01', payerId: ownerMember.id },
        itemId: item.id,
      });

      const changes: { workspaceMemberId: number; value: string }[] =
        res.body.data.createPayment.balanceChanges;

      const byMember = Object.fromEntries(
        changes.map((c) => [c.workspaceMemberId, Number(c.value)]),
      );

      // totalStakes = 3; payer ratio = 2/3 → value = 90 * (1 - 2/3) = +30
      expect(byMember[ownerMember.id]).toBeCloseTo(30, 5);
      // member2 ratio = 1/3 → owes 30
      expect(byMember[member2.id]).toBeCloseTo(-30, 5);
      // member3 ratio = 0 → owes 0
      expect(byMember[member3.id]).toBeCloseTo(0, 5);
    });
  });

  describe('updatePayment resyncs balance', () => {
    it('changing payment cost updates balance changes', async () => {
      const owner = await userFactory.create();
      const user2 = await userFactory.create();

      const workspace = await workspaceFactory.create({
        defaultCurrency: Currency.USD,
        ownerId: owner.id,
      });
      const ownerMember = await workspaceMemberFactory.create(workspace.id, owner.id);
      const member2 = await workspaceMemberFactory.create(workspace.id, user2.id);

      const item = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      await gql(accessToken, setItemStakeRuleMutation, {
        itemId: item.id,
        stakeRule: StakeRule.EQUALLY,
      });

      const createRes = await gql(accessToken, createPaymentMutation, {
        dto: { cost: '100', currency: Currency.USD, date: '2024-01-01', payerId: ownerMember.id },
        itemId: item.id,
      });

      const paymentId = createRes.body.data.createPayment.id;

      const updateRes = await gql(accessToken, updatePaymentMutation, {
        dto: { cost: '200', currency: Currency.USD, date: '2024-01-01', payerId: ownerMember.id },
        paymentId,
      });

      const changes: { workspaceMemberId: number; value: string }[] =
        updateRes.body.data.updatePayment.balanceChanges;

      const byMember = Object.fromEntries(
        changes.map((c) => [c.workspaceMemberId, Number(c.value)]),
      );

      expect(byMember[ownerMember.id]).toBeCloseTo(100, 5);
      expect(byMember[member2.id]).toBeCloseTo(-100, 5);
    });
  });

  describe('stake rule change resyncs all item payments', () => {
    it('switching from ALL_PAYER to EQUALLY recomputes existing payments', async () => {
      const owner = await userFactory.create();
      const user2 = await userFactory.create();

      const workspace = await workspaceFactory.create({
        defaultCurrency: Currency.USD,
        ownerId: owner.id,
      });
      const ownerMember = await workspaceMemberFactory.create(workspace.id, owner.id);
      const member2 = await workspaceMemberFactory.create(workspace.id, user2.id);

      const item = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      await gql(accessToken, setItemStakeRuleMutation, {
        itemId: item.id,
        stakeRule: StakeRule.ALL_PAYER,
      });

      const createRes = await gql(accessToken, createPaymentMutation, {
        dto: { cost: '60', currency: Currency.USD, date: '2024-01-01', payerId: ownerMember.id },
        itemId: item.id,
      });

      const paymentId = createRes.body.data.createPayment.id;

      // All zero with ALL_PAYER
      for (const c of createRes.body.data.createPayment.balanceChanges) {
        expect(Number(c.value)).toBeCloseTo(0, 5);
      }

      // Switch to EQUALLY
      await gql(accessToken, setItemStakeRuleMutation, {
        itemId: item.id,
        stakeRule: StakeRule.EQUALLY,
      });

      const queryRes = await gql(accessToken, paymentWithBalanceChangesQuery, { id: paymentId });
      const changes: { workspaceMemberId: number; value: string }[] =
        queryRes.body.data.payment.balanceChanges;

      const byMember = Object.fromEntries(
        changes.map((c) => [c.workspaceMemberId, Number(c.value)]),
      );

      expect(byMember[ownerMember.id]).toBeCloseTo(30, 5);
      expect(byMember[member2.id]).toBeCloseTo(-30, 5);
    });
  });

  describe('member join / removal does not affect historical balance records', () => {
    it('removing a member preserves their balance rows on payments created while they were active', async () => {
      const owner = await userFactory.create();
      const user2 = await userFactory.create();
      const user3 = await userFactory.create();

      const workspace = await workspaceFactory.create({
        defaultCurrency: Currency.USD,
        ownerId: owner.id,
      });
      const ownerMember = await workspaceMemberFactory.create(workspace.id, owner.id);
      const member2 = await workspaceMemberFactory.create(workspace.id, user2.id);
      const member3 = await workspaceMemberFactory.create(workspace.id, user3.id);

      const item = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      await gql(accessToken, setItemStakeRuleMutation, {
        itemId: item.id,
        stakeRule: StakeRule.EQUALLY,
      });

      const createRes = await gql(accessToken, createPaymentMutation, {
        dto: { cost: '90', currency: Currency.USD, date: '2024-01-01', payerId: ownerMember.id },
        itemId: item.id,
      });

      const paymentId = createRes.body.data.createPayment.id;

      // Remove member3 after payment was created
      await gql(accessToken, removeWorkspaceMemberMutation, { memberId: member3.id });

      const queryRes = await gql(accessToken, paymentWithBalanceChangesQuery, { id: paymentId });
      const changes: { workspaceMemberId: number; value: string }[] =
        queryRes.body.data.payment.balanceChanges;

      // All 3 original rows are preserved — removal does not rewrite history
      expect(changes).toHaveLength(3);

      const byMember = Object.fromEntries(
        changes.map((c) => [c.workspaceMemberId, Number(c.value)]),
      );

      expect(byMember[ownerMember.id]).toBeCloseTo(60, 5);
      expect(byMember[member2.id]).toBeCloseTo(-30, 5);
      expect(byMember[member3.id]).toBeCloseTo(-30, 5);
    });
  });

  describe('balanceCurrencyMode = DEFAULT_CURRENCY', () => {
    it('stores values in workspace default currency when same currency is used', async () => {
      const owner = await userFactory.create();
      const user2 = await userFactory.create();

      const workspace = await workspaceFactory.create({
        defaultCurrency: Currency.USD,
        ownerId: owner.id,
      });
      const ownerMember = await workspaceMemberFactory.create(workspace.id, owner.id);
      await workspaceMemberFactory.create(workspace.id, user2.id);

      const item = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      await gql(accessToken, setItemStakeRuleMutation, {
        itemId: item.id,
        stakeRule: StakeRule.EQUALLY,
      });

      await gql(accessToken, updateWorkspaceBalanceCurrencyModeMutation, {
        mode: BalanceCurrencyMode.DEFAULT_CURRENCY,
        workspaceId: workspace.id,
      });

      const res = await gql(accessToken, createPaymentMutation, {
        dto: { cost: '60', currency: Currency.USD, date: '2024-01-01', payerId: ownerMember.id },
        itemId: item.id,
      });

      const changes: { currency: string }[] = res.body.data.createPayment.balanceChanges;

      for (const change of changes) {
        expect(change.currency).toBe(Currency.USD);
      }
    });
  });

  describe('defaultCurrency change resyncs balance when mode is DEFAULT_CURRENCY', () => {
    it('changing defaultCurrency converts balance values and currency to the new currency', async () => {
      const owner = await userFactory.create();
      const user2 = await userFactory.create();

      const workspace = await workspaceFactory.create({
        defaultCurrency: Currency.BYN,
        ownerId: owner.id,
      });
      const ownerMember = await workspaceMemberFactory.create(workspace.id, owner.id);
      const member2 = await workspaceMemberFactory.create(workspace.id, user2.id);

      const item = await itemFactory.create(workspace.id);
      const { accessToken } = await authService.authenticateUser(owner);

      await gql(accessToken, setItemStakeRuleMutation, {
        itemId: item.id,
        stakeRule: StakeRule.EQUALLY,
      });

      await gql(accessToken, updateWorkspaceBalanceCurrencyModeMutation, {
        mode: BalanceCurrencyMode.DEFAULT_CURRENCY,
        workspaceId: workspace.id,
      });

      // Seed USD→BYN rate: 1 USD = 3 BYN
      await prismaService.currencyRate.create({
        data: {
          date: new Date('2024-01-01'),
          fromCurrency: Currency.USD,
          rate: 3,
          toCurrency: Currency.BYN,
        },
      });

      const createRes = await gql(accessToken, createPaymentMutation, {
        dto: { cost: '30', currency: Currency.USD, date: '2024-01-01', payerId: ownerMember.id },
        itemId: item.id,
      });

      const paymentId = createRes.body.data.createPayment.id;

      // Initial balance: cost 30 USD → 90 BYN; EQUALLY 2 members
      // owner (payer): +45 BYN, member2: -45 BYN
      const initialChanges: { workspaceMemberId: number; value: string; currency: string }[] =
        createRes.body.data.createPayment.balanceChanges;
      const initialByMember = Object.fromEntries(
        initialChanges.map((c) => [
          c.workspaceMemberId,
          { currency: c.currency, value: Number(c.value) },
        ]),
      );

      expect(initialByMember[ownerMember.id].currency).toBe(Currency.BYN);
      expect(initialByMember[ownerMember.id].value).toBeCloseTo(45, 5);
      expect(initialByMember[member2.id].currency).toBe(Currency.BYN);
      expect(initialByMember[member2.id].value).toBeCloseTo(-45, 5);

      // Change defaultCurrency to USD → triggers resync
      await gql(accessToken, updateWorkspaceMutation, {
        dto: { defaultCurrency: Currency.USD, title: 'test' },
        id: workspace.id,
      });

      const queryRes = await gql(accessToken, paymentWithBalanceChangesQuery, { id: paymentId });
      const changes: { workspaceMemberId: number; value: string; currency: string }[] =
        queryRes.body.data.payment.balanceChanges;
      const byMember = Object.fromEntries(
        changes.map((c) => [c.workspaceMemberId, { currency: c.currency, value: Number(c.value) }]),
      );

      // After resync: payment in USD, defaultCurrency now USD — no conversion, cost = 30 USD
      // EQUALLY 2 members: owner +15 USD, member2 -15 USD
      expect(byMember[ownerMember.id].currency).toBe(Currency.USD);
      expect(byMember[ownerMember.id].value).toBeCloseTo(15, 5);
      expect(byMember[member2.id].currency).toBe(Currency.USD);
      expect(byMember[member2.id].value).toBeCloseTo(-15, 5);
    });
  });
});
