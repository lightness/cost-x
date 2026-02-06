import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { ConsistencyModule } from '../consistency/consistency.module';
import { CurrencyRateModule } from '../currency-rate/currency-rate.module';
import { ItemCostModule } from '../item-cost/default-currency-cost.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsByItemIdLoader } from './dataloader/payments-by-item-id.loader.service';
import { PaymentService } from './payment.service';
import { PaymentResolver } from './resolver/payment.resolver';

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
