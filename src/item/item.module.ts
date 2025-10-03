import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from '../database/entities';
import { ItemController } from './item.controller';
import { ItemService } from './item.service';
import { GetItemService } from './get-item.service';
import { ItemCostModule } from '../item-cost/item-cost.module';

@Module({
  imports: [TypeOrmModule.forFeature([Item]), ItemCostModule],
  providers: [ItemService, GetItemService],
  controllers: [ItemController],
  exports: [ItemService],
})
export class ItemModule {}