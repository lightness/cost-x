import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item, Tag } from '../database/entities';
import { ItemTagController } from './item-tag.controller';
import { ItemTagService } from './item-tag.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tag, Item])],
  providers: [ItemTagService],
  controllers: [ItemTagController],
  exports: [ItemTagService],
})
export class ItemTagModule {}