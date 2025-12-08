import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyRateModule } from '../currency-rate/currency-rate.module';
import { Item } from '../database/entities';
import { ItemCostModule } from '../item-cost/default-currency-cost.module';
import { ItemTagModule } from '../item-tag/item-tag.module';
import { PaymentModule } from '../payment/payment.module';
import { FindItemsAggregatesResolver } from './find-items-aggregates.resolver';
import { FindItemsResponseResolver } from './find-items-response.resolver';
import { ItemController } from './item.controller';
import { ItemResolver } from './item.resolver';
import { ItemService } from './item.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Item]), 
    ItemTagModule,
    ItemCostModule,
    PaymentModule, 
    CurrencyRateModule,
  ],
  providers: [
    ItemService,
    // resolvers
    ItemResolver,
    FindItemsAggregatesResolver,
    FindItemsResponseResolver,
  ],
  controllers: [ItemController],
  exports: [ItemService],
})
export class ItemModule {}