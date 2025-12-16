import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyRateModule } from '../../currency-rate/currency-rate.module';
import { ItemTag, Payment } from '../../database/entities';
import { DateModule } from '../../date/date.module';
import { ItemCostModule } from '../../item-cost/default-currency-cost.module';
import { DataloaderService } from './dataloader.service';
import {
  CurrencyRateLoaderService,
  ItemsByTagIdLoaderService,
  PaymentsByItemIdLoaderService,
  TagsByItemIdLoaderService,
} from './providers';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, ItemTag]),
    ItemCostModule,
    CurrencyRateModule,
    DateModule,
  ],
  providers: [
    DataloaderService,
    CurrencyRateLoaderService,
    TagsByItemIdLoaderService,
    ItemsByTagIdLoaderService,
    PaymentsByItemIdLoaderService,
  ],
  exports: [DataloaderService],
})
export class DataLoaderModule { }
