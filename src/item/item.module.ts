import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item } from '../database/entities';
import { ItemController } from './item.controller';
import { ItemService } from './item.service';
import { GetItemService } from './get-item.service';
import { DefaultCurrencyCostModule } from '../item-cost/default-currency-cost.module';

@Module({
  imports: [TypeOrmModule.forFeature([Item]), DefaultCurrencyCostModule],
  providers: [ItemService, GetItemService],
  controllers: [ItemController],
  exports: [ItemService],
})
export class ItemModule {}