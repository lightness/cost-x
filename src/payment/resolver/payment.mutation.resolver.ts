import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope, WorkspacePermission } from '../../access/interfaces';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { Infer } from '../../common/decorator/infer.decorator';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { ItemByIdPipe } from '../../common/pipe/item-by-id.pipe';
import { PaymentByIdPipe } from '../../common/pipe/payment-by-id.pipe';
import { WorkspaceByItemPipe } from '../../common/pipe/workspace-by-item.pipe';
import { WorkspaceByPaymentPipe } from '../../common/pipe/workspace-by-payment.pipe';
import Item from '../../item/entity/item.entity';
import { UserRole } from '../../user/entity/user-role.enum';
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
  @Access.allow({
    or: [
      { owner: 'workspace', scope: AccessScope.WORKSPACE },
      {
        permission: WorkspacePermission.CREATE_PAYMENT,
        scope: AccessScope.WORKSPACE,
        target: 'workspace',
      },
      { role: [UserRole.ADMIN], scope: AccessScope.USER },
    ],
  })
  @Infer('item', { from: fromArg('itemId'), pipes: [ItemByIdPipe] })
  @Infer('workspace', { from: 'item', pipes: [WorkspaceByItemPipe] })
  async createPayment(
    @Args('itemId', { type: () => Int }, ItemByIdPipe) item: Item,
    @Args('dto') dto: PaymentInDto,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.paymentService.createPayment(item, dto, currentUser, tx);
  }

  @Mutation(() => Payment)
  @Access.allow({
    or: [
      { owner: 'workspace', scope: AccessScope.WORKSPACE },
      {
        permission: WorkspacePermission.UPDATE_PAYMENT,
        scope: AccessScope.WORKSPACE,
        target: 'workspace',
      },
      { role: [UserRole.ADMIN], scope: AccessScope.USER },
    ],
  })
  @Infer('payment', { from: fromArg('paymentId'), pipes: [PaymentByIdPipe] })
  @Infer('workspace', { from: 'payment', pipes: [WorkspaceByPaymentPipe] })
  async updatePayment(
    @Args('paymentId', { type: () => Int }, PaymentByIdPipe) payment: Payment,
    @Args('dto') dto: PaymentInDto,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.paymentService.updatePayment(payment, dto, currentUser, tx);
  }

  @Mutation(() => Boolean)
  @Access.allow({
    or: [
      { owner: 'workspace', scope: AccessScope.WORKSPACE },
      {
        permission: WorkspacePermission.DELETE_PAYMENT,
        scope: AccessScope.WORKSPACE,
        target: 'workspace',
      },
      { role: [UserRole.ADMIN], scope: AccessScope.USER },
    ],
  })
  @Infer('payment', { from: fromArg('paymentId'), pipes: [PaymentByIdPipe] })
  @Infer('workspace', { from: 'payment', pipes: [WorkspaceByPaymentPipe] })
  async deletePayment(
    @Args('paymentId', { type: () => Int }, PaymentByIdPipe) payment: Payment,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    await this.paymentService.deletePayment(payment, currentUser, tx);

    return true;
  }
}
