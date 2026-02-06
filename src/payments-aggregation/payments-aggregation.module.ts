import { Module } from '@nestjs/common';
import { CurrencyRateModule } from '../currency-rate/currency-rate.module';
import { ItemCostModule } from '../item-cost/default-currency-cost.module';
import { PaymentModule } from '../payment/payment.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CostByCurrencyByItemIdLoader } from './dataloader/cost-by-currency-by-item-id.loader.service';
import { CostInDefaultCurrencyByItemIdLoader } from './dataloader/cost-in-default-currency-by-item-id.loader.service';
import { FirstPaymentDateByItemIdLoader } from './dataloader/first-payment-date-by-item-id.loader.service';
import { LastPaymentDateByItemIdLoader } from './dataloader/last-payment-date-by-item-id.loader.service';
import { PaymentsCountByItemIdLoader } from './dataloader/payments-count-by-item-id.loader.service';
import { CostByCurrencyAggregationService } from './metric/cost-by-currency-aggregation.service';
import { DecimalSumAggregationService } from './metric/decimal-sum-aggregation.service';
import { EarliestAggregationService } from './metric/earliest-aggregation.service';
import { LatestAggregationService } from './metric/latest-aggregation.service';
import { SumAggregationService } from './metric/sum-aggregation.service';
import { PaymentsAggregationService } from './payments-aggregation.service';
import { PaymentsAggregationResolver } from './resolver/payments-aggregation.resolver';

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
