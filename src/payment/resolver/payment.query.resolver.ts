import { UseGuards } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope, WorkspaceRole } from '../../access/interfaces';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { Infer } from '../../common/decorator/infer.decorator';
import { ItemByIdPipe } from '../../common/pipe/item-by-id.pipe';
import { PaymentByIdPipe } from '../../common/pipe/payment-by-id.pipe';
import { WorkspaceByItemPipe } from '../../common/pipe/workspace-by-item.pipe';
import { WorkspaceByPaymentPipe } from '../../common/pipe/workspace-by-payment.pipe';
import { UserRole } from '../../user/entity/user-role.enum';
import { PaymentsFilter } from '../dto';
import Payment from '../entity/payment.entity';
import { PaymentService } from '../payment.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
export class PaymentQueryResolver {
  constructor(private paymentService: PaymentService) {}

  @Query(() => Payment)
  @Access.allow({
    or: [
      { target: 'workspace', targetScope: AccessScope.WORKSPACE, workspaceRole: [WorkspaceRole.OWNER, WorkspaceRole.MEMBER] },
      { role: [UserRole.ADMIN], targetScope: AccessScope.USER },
    ],
  })
  @Infer('payment', { from: fromArg('id'), pipes: [PaymentByIdPipe] })
  @Infer('workspace', { from: 'payment', pipes: [WorkspaceByPaymentPipe] })
  async payment(@Args('id', { type: () => Int }, PaymentByIdPipe) payment: Payment) {
    return payment;
  }

  @Query(() => [Payment])
  @Access.allow({
    or: [
      { target: 'workspace', targetScope: AccessScope.WORKSPACE, workspaceRole: [WorkspaceRole.OWNER, WorkspaceRole.MEMBER] },
      { role: [UserRole.ADMIN], targetScope: AccessScope.USER },
    ],
  })
  @Infer('item', { from: fromArg('itemId'), pipes: [ItemByIdPipe] })
  @Infer('workspace', { from: 'item', pipes: [WorkspaceByItemPipe] })
  async payments(
    @Args('itemId', { type: () => Int }) itemId: number,
    @Args('paymentsFilter', { nullable: true }) filter: PaymentsFilter,
  ) {
    return this.paymentService.getItemPayments(itemId, filter);
  }
}
