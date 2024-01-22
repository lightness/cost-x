import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item, ItemTag, Tag } from '../database/entities';
import { ItemTagController } from './item-tag.controller';
import { ItemTagService } from './item-tag.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tag, Item, ItemTag])],
  providers: [ItemTagService],
  controllers: [ItemTagController],
})
export class ItemTagModule {}