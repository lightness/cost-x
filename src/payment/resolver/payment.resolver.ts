import { NotFoundException, UseGuards } from '@nestjs/common';
import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope } from '../../access/interfaces';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { ItemByIdPipe } from '../../common/pipe/item-by-id.pipe';
import { PaymentByIdPipe } from '../../common/pipe/payment-by-id.pipe';
import Item from '../../item/entity/item.entity';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '../../user/entity/user-role.enum';
import { PaymentInDto, PaymentsFilter } from '../dto';
import Payment from '../entity/payment.entity';
import { PaymentService } from '../payment.service';

@Resolver(() => Payment)
@UseGuards(AuthGuard, AccessGuard)
export class PaymentResolver {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
  ) {}

  @ResolveField(() => Item)
  async item(@Parent() payment: Payment) {
    const { itemId } = payment;

    const item = await this.prisma.item.findFirst({ where: { id: itemId } });

    if (!item) {
      throw new NotFoundException(`Item with ID ${itemId} not found`);
    }

    return item;
  }

  @Query(() => Payment)
  @Access.allow([
    { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    {
      role: [UserRole.USER],
      targetId: fromArg('id'),
      targetScope: AccessScope.PAYMENT,
    },
  ])
  async payment(@Args('id', { type: () => Int }) id: number) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });

    if (!payment) {
      throw new NotFoundException(id);
    }

    return payment;
  }

  @Query(() => [Payment])
  @Access.allow([
    { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    {
      role: [UserRole.USER],
      targetId: fromArg('itemId'),
      targetScope: AccessScope.ITEM,
    },
  ])
  async payments(
    @Args('itemId', { type: () => Int }) itemId: number,
    @Args('paymentsFilter', { nullable: true }) filter: PaymentsFilter,
  ) {
    const payments = await this.paymentService.getItemPayments(itemId, filter);

    return { data: payments };
  }

  @Mutation(() => Payment)
  @Access.allow([
    { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    {
      role: [UserRole.USER],
      targetId: fromArg('itemId'),
      targetScope: AccessScope.ITEM,
    },
  ])
  async createPayment(
    @Args('itemId', { type: () => Int }, ItemByIdPipe) item: Item,
    @Args('dto') dto: PaymentInDto,
  ) {
    return this.paymentService.createPayment(item, dto);
  }

  @Mutation(() => Payment)
  @Access.allow([
    { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    {
      role: [UserRole.USER],
      targetId: fromArg('paymentId'),
      targetScope: AccessScope.PAYMENT,
    },
  ])
  async updatePayment(
    @Args('paymentId', { type: () => Int }, PaymentByIdPipe) payment: Payment,
    @Args('dto') dto: PaymentInDto,
  ) {
    return this.paymentService.updatePayment(payment, dto);
  }

  @Mutation(() => Boolean)
  @Access.allow([
    { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    {
      role: [UserRole.USER],
      targetId: fromArg('paymentId'),
      targetScope: AccessScope.PAYMENT,
    },
  ])
  async deletePayment(
    @Args('paymentId', { type: () => Int }, PaymentByIdPipe) payment: Payment,
  ) {
    await this.paymentService.deletePayment(payment);
  }
}
