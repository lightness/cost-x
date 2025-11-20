import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ItemByIdPipe } from '../common/pipes/item-by-id.pipe';
import { Item } from '../database/entities';
import { ItemInDto, ListItemQueryDto } from './dto';
import { ItemService } from './item.service';

@Controller()
export class ItemController {
  constructor(private itemService: ItemService) { }

  @Get('items')
  async list(
    @Query() query: ListItemQueryDto,
  ) {
    return this.itemService.list(query);
  }

  @Get('items/:id')
  async get(
    @Param('id', ParseIntPipe, ItemByIdPipe) item: Item,
  ) {
    return item;
  }

  @Post('items')
  async create(@Body() dto: ItemInDto) {
    return this.itemService.create(dto);
  }

  @Put('items/:id')
  async update(@Param('id', ParseIntPipe, ItemByIdPipe) item: Item, @Body() dto: ItemInDto) {
    return this.itemService.update(item, dto);
  }

  @Delete('items/:id')
  async delete(@Param('id', ParseIntPipe, ItemByIdPipe) item: Item) {
    await this.itemService.delete(item);

    return { deleted: true };
  }
}