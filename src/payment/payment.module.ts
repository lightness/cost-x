import { Module } from '@nestjs/common';
import { ConsistencyModule } from '../consistency/consistency.module';
import { CurrencyRateModule } from '../currency-rate/currency-rate.module';
import { ItemCostModule } from '../item-cost/default-currency-cost.module';
import { PaymentsByItemIdLoader } from './dataloaders/payments-by-item-id.loader.service';
import { PaymentResolver } from './resolver/payment.resolver';
import { PaymentService } from './payment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AccessModule } from '../access/access.module';

@Module({
  exports: [PaymentService, PaymentsByItemIdLoader],
  imports: [
    PrismaModule,
    AuthModule,
    AccessModule,
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
  ],
})
export class PaymentModule {}
