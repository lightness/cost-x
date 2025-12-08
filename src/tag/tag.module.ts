import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from '../database/entities';
import { TagsByItemIdLoader } from '../item-tag/dataloaders/tags-by-item-id.loader.service';
import { ItemTagModule } from '../item-tag/item-tag.module';
import { TagController } from './tag.controller';
import { TagResolver } from './tag.resolver';
import { TagService } from './tag.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tag]),
    ItemTagModule,
  ],
  providers: [
    TagService,
    // resolvers
    TagResolver,
  ],
  controllers: [TagController],
  exports: [TagService],
})
export class TagModule { }
