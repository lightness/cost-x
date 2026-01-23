import { NotFoundException, UseGuards } from '@nestjs/common';
import {
  Args,
  Int,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { AccessGuard } from '../../access/guard/access.guard';
import { AuthGuard } from '../../auth/guard/auth.guard';
import Item from '../../item/entities/item.entity';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsFilter } from '../dto';
import Payment from '../entities/payment.entity';
import { PaymentService } from '../payment.service';
import { Access } from '../../access/decorator/access.decorator';
import { AccessScope } from '../../access/interfaces';
import { UserRole } from '../../user/entities/user-role.enum';
import { fromArg } from '../../access/function/from-arg.function';

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
    { targetScope: AccessScope.GLOBAL, role: [UserRole.ADMIN] },
    {
      targetScope: AccessScope.PAYMENT,
      targetId: fromArg('id'),
      role: [UserRole.USER],
    },
  ])
  async payment(@Args('id', { type: () => Int }) id: number) {
    const payment = await this.prisma.payment.findFirst({ where: { id } });

    if (!payment) {
      throw new NotFoundException(id);
    }

    return payment;
  }

  @Query(() => [Payment])
  @Access.allow([
    { targetScope: AccessScope.GLOBAL, role: [UserRole.ADMIN] },
    {
      targetScope: AccessScope.ITEM,
      targetId: fromArg('itemId'),
      role: [UserRole.USER],
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
