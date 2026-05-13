import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import Payment from '../../payment/entity/payment.entity';
import { ItemByPaymentIdLoader } from '../dataloader/item-by-payment-id.loader.service';
import Item from '../entity/item.entity';

@Resolver(() => Payment)
export class PaymentItemFieldResolver {
  constructor(private itemByPaymentIdLoader: ItemByPaymentIdLoader) {}

  @ResolveField(() => Item)
  async item(@Parent() payment: Payment) {
    return this.itemByPaymentIdLoader.load(payment.id);
  }
}
