import { Module } from '@nestjs/common';
import { CurrencyRateModule } from '../currency-rate/currency-rate.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CostByCurrencyService } from './cost-by-currency.service';
import { DefaultCurrencyCostService } from './default-currency-cost.service';

@Module({
  exports: [DefaultCurrencyCostService, CostByCurrencyService],
  imports: [PrismaModule, CurrencyRateModule],
  providers: [DefaultCurrencyCostService, CostByCurrencyService],
})
export class ItemCostModule {}
