import { Controller, Delete, Param, ParseIntPipe, Put } from '@nestjs/common';
import { ItemTagService } from './item-tag.service';
import { ItemByIdPipe } from '../common/pipes/item-by-id.pipe';
import { Item, Tag } from '../database/entities';
import { TagByIdPipe } from '../common/pipes/tag-by-id.pipe';

@Controller()
export class ItemTagController {
  constructor(private itemTagService: ItemTagService) {}

  @Put('items/:itemId/tags/:tagId')
  async set(
    @Param('itemId', ParseIntPipe, ItemByIdPipe) item: Item,
    @Param('tagId', ParseIntPipe, TagByIdPipe) tag: Tag
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