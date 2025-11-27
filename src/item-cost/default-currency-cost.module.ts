import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CurrencyRateModule } from '../currency-rate/currency-rate.module';
import { CostByCurrencyService } from './cost-by-currency.service';
import { DefaultCurrencyCostService } from './default-currency-cost.service';

@Module({
  imports: [ConfigModule, CurrencyRateModule],
  providers: [DefaultCurrencyCostService, CostByCurrencyService],
  exports: [DefaultCurrencyCostService, CostByCurrencyService],
})
export class ItemCostModule {}