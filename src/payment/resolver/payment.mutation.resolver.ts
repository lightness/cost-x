import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access } from '../../access/decorator/access.decorator';
import { Permission } from '../../access/entity/permission.enum';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope, PermissionLevel } from '../../access/interfaces';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { ItemByIdPipe } from '../../common/pipe/item-by-id.pipe';
import { PaymentByIdPipe } from '../../common/pipe/payment-by-id.pipe';
import Item from '../../item/entity/item.entity';
import User from '../../user/entity/user.entity';
import { PaymentInDto } from '../dto';
import Payment from '../entity/payment.entity';
import { PaymentService } from '../payment.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(TransactionInterceptor)
export class PaymentMutationResolver {
  constructor(private paymentService: PaymentService) {}

  @Mutation(() => Payment)
  @Access.allow([
    {
      and: [
        { targetId: fromArg('itemId'), targetScope: AccessScope.ITEM },
        { level: PermissionLevel.OWNER, permission: Permission.PAYMENT_CREATE },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.PAYMENT_CREATE },
  ])
  async createPayment(
    @Args('itemId', { type: () => Int }, ItemByIdPipe) item: Item,
    @Args('dto') dto: PaymentInDto,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.paymentService.createPayment(item, dto, currentUser, tx);
  }

  @Mutation(() => Payment)
  @Access.allow([
    {
      and: [
        { targetId: fromArg('paymentId'), targetScope: AccessScope.PAYMENT },
        { level: PermissionLevel.OWNER, permission: Permission.PAYMENT_UPDATE },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.PAYMENT_UPDATE },
  ])
  async updatePayment(
    @Args('paymentId', { type: () => Int }, PaymentByIdPipe) payment: Payment,
    @Args('dto') dto: PaymentInDto,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.paymentService.updatePayment(payment, dto, currentUser, tx);
  }

  @Mutation(() => Boolean)
  @Access.allow([
    {
      and: [
        { targetId: fromArg('paymentId'), targetScope: AccessScope.PAYMENT },
        { level: PermissionLevel.OWNER, permission: Permission.PAYMENT_DELETE },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.PAYMENT_DELETE },
  ])
  async deletePayment(
    @Args('paymentId', { type: () => Int }, PaymentByIdPipe) payment: Payment,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    await this.paymentService.deletePayment(payment, currentUser, tx);

    return true;
  }
}
