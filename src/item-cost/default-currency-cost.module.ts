import { Module } from '@nestjs/common';
import { DefaultCurrencyCostService } from './default-currency-cost.service';
import { ConfigModule } from '@nestjs/config';
import { CurrencyRateModule } from '../currency-rate/currency-rate.module';

@Module({
  imports: [ConfigModule, CurrencyRateModule],
  providers: [DefaultCurrencyCostService],
  exports: [DefaultCurrencyCostService],
})
export class DefaultCurrencyCostModule {}