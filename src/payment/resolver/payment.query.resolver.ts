import { NotFoundException, UseGuards } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope } from '../../access/interfaces';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { UserRole } from '../../user/entity/user-role.enum';
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
}
