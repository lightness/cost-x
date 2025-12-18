import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../database/entities';
import { PaymentsCountByItemIdLoader } from './dataloaders/payments-count-by-item-id.loader.service';
import { PaymentsAggregationService } from './payments-aggregation.service';
import { PaymentsAggregationResolver } from './resolvers/payments-aggregation.resolver';
import { PaymentModule } from '../payment/payment.module';
import { CurrencyRateModule } from '../currency-rate/currency-rate.module';
import { ItemCostModule } from '../item-cost/default-currency-cost.module';
import { CostInDefaultCurrencyByItemIdLoader } from './dataloaders/cost-in-default-currency-by-item-id.loader.service';

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
    // resolver
    PaymentsAggregationResolver,
    // service
    PaymentsAggregationService,
  ]
})
export class PaymentsAggregationModule {}