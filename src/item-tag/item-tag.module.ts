import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item, ItemTag, Tag } from '../database/entities';
import { ItemTagController } from './item-tag.controller';
import { ItemTagService } from './item-tag.service';
import { ItemsByTagIdLoader } from './dataloaders/items-by-tag-id.loader.service';
import { TagsByItemIdLoader } from './dataloaders/tags-by-item-id.loader.service';

@Module({
  imports: [TypeOrmModule.forFeature([ItemTag, Tag, Item])],
  providers: [
    ItemTagService,
    // dataloaders
    ItemsByTagIdLoader,
    TagsByItemIdLoader,
  ],
  controllers: [ItemTagController],
  exports: [
    ItemTagService,
    ItemsByTagIdLoader,
    TagsByItemIdLoader,
  ],
})
export class ItemTagModule { }