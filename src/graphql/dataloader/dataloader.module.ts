import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemTag, Payment } from '../../database/entities';
import { DefaultCurrencyCostModule } from '../../item-cost/default-currency-cost.module';
import { DataloaderService } from './dataloader.service';
import { 
  costByCurrencyByItemIdLoaderProvider, 
  costInDefaultCurrencyByItemIdLoaderProvider, 
  itemsByTagIdLoaderProvider, 
  paymentsByItemIdLoaderProvider, 
  tagsByItemIdLoaderProvider,
} from './providers';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, ItemTag]), DefaultCurrencyCostModule],
  providers: [
    DataloaderService,
    costInDefaultCurrencyByItemIdLoaderProvider,
    costByCurrencyByItemIdLoaderProvider,
    tagsByItemIdLoaderProvider,
    itemsByTagIdLoaderProvider,
    paymentsByItemIdLoaderProvider,
  ],
  exports: [DataloaderService],
})
export class DataLoaderModule { }
