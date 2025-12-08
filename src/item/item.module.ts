import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item, ItemTag } from '../database/entities';
import { ItemCostModule } from '../item-cost/default-currency-cost.module';
import { PaymentModule } from '../payment/payment.module';
import { ItemsByTagIdLoaderService } from './dataloaders/items-by-tag-id.loader.service';
import { FindItemsAggregatesResolver } from './find-items-aggregates.resolver';
import { FindItemsResponseResolver } from './find-items-response.resolver';
import { ItemController } from './item.controller';
import { ItemResolver } from './item.resolver';
import { ItemService } from './item.service';

@Module({
  imports: [TypeOrmModule.forFeature([Item, ItemTag]), PaymentModule, ItemCostModule],
  providers: [
    ItemService, 
    // dataloaders
    ItemsByTagIdLoaderService,
    // resolvers
    ItemResolver,
    FindItemsAggregatesResolver,
    FindItemsResponseResolver,
  ],
  controllers: [ItemController],
  exports: [ItemService],
})
export class ItemModule {}