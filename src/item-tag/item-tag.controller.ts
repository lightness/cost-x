import { Controller, Delete, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ItemTagService } from './item-tag.service';

@Controller()
export class ItemTagController {
  constructor(private itemTagService: ItemTagService) {}

  @Post('items/:itemId/tags/:tagId')
  async set(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Param('tagId', ParseIntPipe) tagId: number,
  ) {
    return this.itemTagService.setTag(itemId, tagId);
  }

  @Delete('items/:itemId/tags/:tagId')
  async remove(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Param('tagId', ParseIntPipe) tagId: number,
  ) {
    return this.itemTagService.removeTag(itemId, tagId);
  }
}