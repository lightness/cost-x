import { Module } from '@nestjs/common';
import { CurrencyRateModule } from '../currency-rate/currency-rate.module';
import { GroupModule } from '../group/group.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentBalanceChangesByPaymentIdLoader } from './dataloader/payment-balance-changes-by-payment-id.loader.service';
import { PaymentBalanceService } from './payment-balance.service';
import { PaymentBalanceChangesFieldResolver } from './resolver/payment-balance-changes.field.resolver';

@Module({
  exports: [PaymentBalanceService],
  imports: [PrismaModule, CurrencyRateModule, GroupModule],
  providers: [
    PaymentBalanceService,
    // dataloader
    PaymentBalanceChangesByPaymentIdLoader,
    // resolver
    PaymentBalanceChangesFieldResolver,
  ],
})
export class PaymentBalanceModule {}
