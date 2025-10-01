import { Module } from '@nestjs/common';
import { ItemCostService } from './item-cost.service';
import { ConfigModule } from '@nestjs/config';
import { CurrencyRateModule } from '../currency-rate/currency-rate.module';

@Module({
  imports: [ConfigModule, CurrencyRateModule],
  providers: [ItemCostService],
  exports: [ItemCostService],
})
export class ItemCostModule {}