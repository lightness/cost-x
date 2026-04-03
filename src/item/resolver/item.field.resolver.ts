import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { TagsByItemIdLoader } from '../../item-tag/dataloader/tags-by-item-id.loader.service';
import { PaymentsByItemIdLoader } from '../../payment/dataloader/payments-by-item-id.loader.service';
import { PaymentsFilter } from '../../payment/dto';
import Payment from '../../payment/entity/payment.entity';
import { PaymentService } from '../../payment/payment.service';
import { PaymentsAggregation } from '../../payments-aggregation/entity/payments-aggregation.entity';
import { PrismaService } from '../../prisma/prisma.service';
import Tag from '../../tag/entity/tag.entity';
import { Workspace } from '../../workspace/entity/workspace.entity';
import Item from '../entity/item.entity';

@Resolver(() => Item)
export class ItemFieldResolver {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
    private paymentsByItemIdLoader: PaymentsByItemIdLoader,
    private tagsByItemIdLoader: TagsByItemIdLoader,
  ) {}

  @ResolveField(() => [Payment])
  async payments(
    @Parent() item: Item,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ): Promise<Payment[]> {
    const allPayments = await this.paymentsByItemIdLoader.withOptions(paymentsFilter).load(item.id);

    return this.paymentService.filterPayments(allPayments, paymentsFilter);
  }

  @ResolveField(() => [Tag])
  async tags(@Parent() item: Item) {
    return this.tagsByItemIdLoader.load(item.id);
  }

  @ResolveField(() => PaymentsAggregation)
  async paymentsAggregation(
    @Parent() item: Item,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ) {
    return {
      itemIds: [item.id],
      paymentsFilter,
    };
  }

  @ResolveField(() => Workspace)
  async workspace(@Parent() item: Item) {
    return this.prisma.workspace.findUnique({ where: { id: item.workspaceId } });
  }
}
