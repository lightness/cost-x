import { Module } from '@nestjs/common';
import { ItemTagController } from './item-tag.controller';
import { ItemTagService } from './item-tag.service';
import { ItemsByTagIdLoader } from './dataloaders/items-by-tag-id.loader.service';
import { TagsByItemIdLoader } from './dataloaders/tags-by-item-id.loader.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GroupModule } from '../group/group.module';

@Module({
  imports: [PrismaModule, GroupModule],
  providers: [
    ItemTagService,
    // dataloaders
    ItemsByTagIdLoader,
    TagsByItemIdLoader,
  ],
  controllers: [ItemTagController],
  exports: [ItemTagService, ItemsByTagIdLoader, TagsByItemIdLoader],
})
export class ItemTagModule {}
