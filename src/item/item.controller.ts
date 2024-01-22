import { Body, Controller, Delete, Get, Param, ParseBoolPipe, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ItemService } from './item.service';
import { ItemInDto } from './dto';

@Controller()
export class ItemController {
  constructor(private itemService: ItemService) {}

  @Get('items')
  async list(
    @Query('term') term?: string | undefined,
    @Query('with_tags', new ParseBoolPipe({ optional: true })) withTags?: boolean | undefined,
    @Query('with_payments', new ParseBoolPipe({ optional: true })) withPayments?: boolean | undefined,
  ) {
    return this.itemService.list(term, withTags, withPayments);
  }

  @Post('items')
  async create(@Body() dto: ItemInDto) {
    return this.itemService.create(dto);
  }

  @Get('items/:id')
  async get(
    @Param('id', ParseIntPipe) id: number,
    @Query('with_tags', new ParseBoolPipe({ optional: true })) withTags?: boolean | undefined,
    @Query('with_payments', new ParseBoolPipe({ optional: true })) withPayments?: boolean | undefined,
  ) {
    return this.itemService.get(id, withTags, withPayments);
  }

  @Put('items/:id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: ItemInDto) {
    return this.itemService.update(id, dto);
  }

  @Delete('items/:id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.itemService.delete(id);

    return { deleted: true };
  }
}