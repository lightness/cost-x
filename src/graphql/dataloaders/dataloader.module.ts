import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemTag, Payment } from '../../database/entities';
import { ItemCostModule } from '../../item-cost/default-currency-cost.module';
import { DataloaderService } from './dataloader.service';
import {
  PaymentsByItemIdLoaderService,
  ItemsByTagIdLoaderService,
  TagsByItemIdLoaderService,
} from './providers';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, ItemTag]), ItemCostModule],
  providers: [
    DataloaderService,
    TagsByItemIdLoaderService,
    ItemsByTagIdLoaderService,
    PaymentsByItemIdLoaderService,
  ],
  exports: [DataloaderService],
})
export class DataLoaderModule { }
