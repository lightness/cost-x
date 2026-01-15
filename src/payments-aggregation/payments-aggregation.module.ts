import { Module } from '@nestjs/common';
import { CurrencyRateModule } from '../currency-rate/currency-rate.module';
import { ItemCostModule } from '../item-cost/default-currency-cost.module';
import { PaymentModule } from '../payment/payment.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CostByCurrencyByItemIdLoader } from './dataloaders/cost-by-currency-by-item-id.loader.service';
import { CostInDefaultCurrencyByItemIdLoader } from './dataloaders/cost-in-default-currency-by-item-id.loader.service';
import { FirstPaymentDateByItemIdLoader } from './dataloaders/first-payment-date-by-item-id.loader.service';
import { LastPaymentDateByItemIdLoader } from './dataloaders/last-payment-date-by-item-id.loader.service';
import { PaymentsCountByItemIdLoader } from './dataloaders/payments-count-by-item-id.loader.service';
import { CostByCurrencyAggregationService } from './metrics/cost-by-currency-aggregation.service';
import { DecimalSumAggregationService } from './metrics/decimal-sum-aggregation.service';
import { EarliestAggregationService } from './metrics/earliest-aggregation.service';
import { LatestAggregationService } from './metrics/latest-aggregation.service';
import { SumAggregationService } from './metrics/sum-aggregation.service';
import { PaymentsAggregationService } from './payments-aggregation.service';
import { PaymentsAggregationResolver } from './resolvers/payments-aggregation.resolver';

@Module({
  imports: [PrismaModule, PaymentModule, CurrencyRateModule, ItemCostModule],
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
    // aggregation service
    SumAggregationService,
    DecimalSumAggregationService,
    EarliestAggregationService,
    LatestAggregationService,
    CostByCurrencyAggregationService,
  ],
})
export class PaymentsAggregationModule {}
