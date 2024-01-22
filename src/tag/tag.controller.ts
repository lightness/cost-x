import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { TagInDto } from './dto';
import { TagService } from './tag.service';

@Controller()
export class TagController {
  constructor(private tagService: TagService) {}

  @Get('tags')
  async list(@Query('term') term?: string | undefined) {
    return this.tagService.list(term);
  }

  @Post('tags')
  async create(@Body() dto: TagInDto) {
    return this.tagService.create(dto);
  }

  @Get('tags/:id')
  async get(@Param('id', ParseIntPipe) id: number) {
    return this.tagService.get(id);
  }

  @Put('tags/:id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: TagInDto) {
    return this.tagService.update(id, dto);
  }

  @Delete('tags/:id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.tagService.delete(id);

    return { deleted: true };
  }

}