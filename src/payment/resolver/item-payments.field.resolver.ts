import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import Item from '../../item/entity/item.entity';
import { PaymentsByItemIdLoader } from '../dataloader/payments-by-item-id.loader.service';
import { PaymentsFilter } from '../dto';
import Payment from '../entity/payment.entity';
import { PaymentService } from '../payment.service';

@Resolver(() => Item)
export class ItemPaymentsFieldResolver {
  constructor(
    private paymentService: PaymentService,
    private paymentsByItemIdLoader: PaymentsByItemIdLoader,
  ) {}

  @ResolveField(() => [Payment])
  async payments(
    @Parent() item: Item,
    @Args('paymentsFilter', { nullable: true }) paymentsFilter: PaymentsFilter,
  ): Promise<Payment[]> {
    const allPayments = await this.paymentsByItemIdLoader.withOptions(paymentsFilter).load(item.id);

    return this.paymentService.filterPayments(allPayments, paymentsFilter);
  }
}
