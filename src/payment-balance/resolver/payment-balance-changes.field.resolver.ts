import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import Payment from '../../payment/entity/payment.entity';
import { PaymentBalanceChangesByPaymentIdLoader } from '../dataloader/payment-balance-changes-by-payment-id.loader.service';
import PaymentBalanceChange from '../entity/payment-balance-change.entity';

@Resolver(() => Payment)
export class PaymentBalanceChangesFieldResolver {
  constructor(private loader: PaymentBalanceChangesByPaymentIdLoader) {}

  @ResolveField(() => [PaymentBalanceChange])
  async balanceChanges(@Parent() payment: Payment) {
    return this.loader.load(payment.id);
  }
}
