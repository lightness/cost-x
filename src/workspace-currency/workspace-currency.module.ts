import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { PaymentBalanceModule } from '../payment-balance/payment-balance.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkspaceCurrencyMutationResolver } from './resolver/workspace-currency.mutation.resolver';
import { WorkspaceCurrencyService } from './workspace-currency.service';

@Module({
  imports: [PrismaModule, AuthModule, AccessModule, PaymentBalanceModule],
  providers: [WorkspaceCurrencyService, WorkspaceCurrencyMutationResolver],
})
export class WorkspaceCurrencyModule {}
