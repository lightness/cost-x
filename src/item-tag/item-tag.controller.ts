import { Controller, Delete, Param, ParseIntPipe, Put } from '@nestjs/common';
import type { ItemTagService } from './item-tag.service';
import { ItemByIdPipe } from '../common/pipes/item-by-id.pipe';
import { TagByIdPipe } from '../common/pipes/tag-by-id.pipe';
import type Item from '../item/entities/item.entity';
import type Tag from '../tag/entities/tag.entity';

@Controller()
export class ItemTagController {
  constructor(private itemTagService: ItemTagService) {}

  @Put('items/:itemId/tags/:tagId')
  async set(
    @Param('itemId', ParseIntPipe, ItemByIdPipe) item: Item,
    @Param('tagId', ParseIntPipe, TagByIdPipe) tag: Tag,
  ) {
    return this.itemTagService.setTag(item, tag);
  }

  @Delete('items/:itemId/tags/:tagId')
  async remove(
    @Param('itemId', ParseIntPipe, ItemByIdPipe) item: Item,
    @Param('tagId', ParseIntPipe, TagByIdPipe) tag: Tag,
  ) {
    return this.itemTagService.removeTag(item, tag);
  }
}
