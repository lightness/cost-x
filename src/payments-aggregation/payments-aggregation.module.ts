import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyRateModule } from '../currency-rate/currency-rate.module';
import { Payment } from '../database/entities';
import { ItemCostModule } from '../item-cost/default-currency-cost.module';
import { PaymentModule } from '../payment/payment.module';
import { CostByCurrencyByItemIdLoader } from './dataloaders/cost-by-currency-by-item-id.loader.service';
import { CostInDefaultCurrencyByItemIdLoader } from './dataloaders/cost-in-default-currency-by-item-id.loader.service';
import { FirstPaymentDateByItemIdLoader } from './dataloaders/first-payment-date-by-item-id.loader.service';
import { LastPaymentDateByItemIdLoader } from './dataloaders/last-payment-date-by-item-id.loader.service';
import { PaymentsCountByItemIdLoader } from './dataloaders/payments-count-by-item-id.loader.service';
import { PaymentsAggregationService } from './payments-aggregation.service';
import { PaymentsAggregationResolver } from './resolvers/payments-aggregation.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    PaymentModule,
    CurrencyRateModule,
    ItemCostModule,
  ],
  providers: [
    // dataloader
    PaymentsCountByItemIdLoader,
    CostInDefaultCurrencyByItemIdLoader,
    CostByCurrencyByItemIdLoader,
    FirstPaymentDateByItemIdLoader,
    LastPaymentDateByItemIdLoader,
    // resolver
    PaymentsAggregationResolver,
    // service
    PaymentsAggregationService,
  ]
})
export class PaymentsAggregationModule {}