import { Body, Controller, Delete, Get, Param, ParseBoolPipe, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ItemService } from './item.service';
import { ItemInDto } from './dto';
import { ItemByIdPipe } from '../common/pipes/item-by-id.pipe';
import { Item } from '../database/entities';
import { GetItemService } from './get-item.service';

@Controller()
export class ItemController {
  constructor(private itemService: ItemService, private getItemService: GetItemService) {}

  @Get('items')
  async list(
    @Query('term') term?: string | undefined,
    @Query('with_tags', new ParseBoolPipe({ optional: true })) withTags?: boolean | undefined,
    @Query('with_payments', new ParseBoolPipe({ optional: true })) withPayments?: boolean | undefined,
    @Query('with_item_cost', new ParseBoolPipe({ optional: true })) withItemCost?: boolean | undefined,
  ) {
    return this.getItemService.list(term, withTags, withPayments, withItemCost);
  }

  @Get('items/:id')
  async get(
    @Param('id', ParseIntPipe, ItemByIdPipe) item: Item,
    @Query('with_tags', new ParseBoolPipe({ optional: true })) withTags?: boolean | undefined,
    @Query('with_payments', new ParseBoolPipe({ optional: true })) withPayments?: boolean | undefined,
    @Query('with_item_cost', new ParseBoolPipe({ optional: true })) withItemCost?: boolean | undefined,
  ) {
    return this.getItemService.get(item, withTags, withPayments, withItemCost);
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