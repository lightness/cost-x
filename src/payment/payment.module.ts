import { Module } from '@nestjs/common';
import { ConsistencyModule } from '../consistency/consistency.module';
import { CurrencyRateModule } from '../currency-rate/currency-rate.module';
import { ItemCostModule } from '../item-cost/default-currency-cost.module';
import { PaymentsByItemIdLoader } from './dataloaders/payments-by-item-id.loader.service';
import { FindPaymentsAggregatesResolver } from './find-payments-aggregates.resolver';
import { FindPaymentsResponseResolver } from './find-payments-response.resolver';
import { PaymentController } from './payment.controller';
import { PaymentResolver } from './payment.resolver';
import { PaymentService } from './payment.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ConsistencyModule,
    ItemCostModule,
    CurrencyRateModule,
  ],
  providers: [
    PaymentService,
    // dataloaders
    PaymentsByItemIdLoader,
    // resolvers
    PaymentResolver,
    FindPaymentsAggregatesResolver,
    FindPaymentsResponseResolver,
  ],
  controllers: [PaymentController],
  exports: [PaymentService, PaymentsByItemIdLoader],
})
export class PaymentModule {}
