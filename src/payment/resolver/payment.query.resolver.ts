import { NotFoundException, UseGuards } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope, PermissionLevel } from '../../access/interfaces';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { Permission } from '../../access/entity/permission.enum';
import { PaymentsFilter } from '../dto';
import Payment from '../entity/payment.entity';
import { PaymentService } from '../payment.service';
import { PrismaService } from '../../prisma/prisma.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
export class PaymentQueryResolver {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
  ) {}

  @Query(() => Payment)
  @Access.allow([
    {
      and: [
        { targetId: fromArg('id'), targetScope: AccessScope.PAYMENT },
        { level: PermissionLevel.OWNER, permission: Permission.PAYMENT_READ },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.PAYMENT_READ },
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
    {
      and: [
        { targetId: fromArg('itemId'), targetScope: AccessScope.ITEM },
        { level: PermissionLevel.OWNER, permission: Permission.PAYMENT_READ },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.PAYMENT_READ },
  ])
  async payments(
    @Args('itemId', { type: () => Int }) itemId: number,
    @Args('paymentsFilter', { nullable: true }) filter: PaymentsFilter,
  ) {
    const payments = await this.paymentService.getItemPayments(itemId, filter);

    return { data: payments };
  }
}
