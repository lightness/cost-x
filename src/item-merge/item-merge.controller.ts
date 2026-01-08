import { Controller, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ItemMergeService } from './item-merge.service';
import { ItemByIdPipe } from '../common/pipes/item-by-id.pipe';
import Item from '../item/entities/item.entity';

@Controller()
export class ItemMergeController {
  constructor(private itemMergeService: ItemMergeService) {}

  @Post('items/:hostItemId/merge')
  async merge(
    @Param('hostItemId', ParseIntPipe, ItemByIdPipe) hostItem: Item,
    @Query('mergingItemId', ParseIntPipe, ItemByIdPipe) mergingItem: Item,
  ) {
    return this.itemMergeService.merge(hostItem, mergingItem);
  }
}