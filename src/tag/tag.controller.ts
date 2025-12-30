import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ListTagQueryDto, TagInDto } from './dto';
import { TagService } from './tag.service';
import { TagByIdPipe } from '../common/pipes/tag-by-id.pipe';
import Tag from './entities/tag.entity';

@Controller()
export class TagController {
  constructor(private tagService: TagService) {}

  @Get('tags/:id')
  async get(@Param('id', ParseIntPipe, TagByIdPipe) tag: Tag) {
    return tag;
  }

  @Get('tags')
  async list(@Query() query: ListTagQueryDto) {
    return this.tagService.list(query);
  }

  @Post('tags')
  async create(@Body() dto: TagInDto) {
    return this.tagService.create(dto);
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
