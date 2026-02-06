import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { ConsistencyModule } from '../consistency/consistency.module';
import { GroupModule } from '../group/group.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ItemsByTagIdLoader } from './dataloader/items-by-tag-id.loader.service';
import { TagsByItemIdLoader } from './dataloader/tags-by-item-id.loader.service';
import { ItemTagService } from './item-tag.service';
import { ItemTagResolver } from './resolver/item-tag.resolver';

@Module({
  exports: [ItemTagService, ItemsByTagIdLoader, TagsByItemIdLoader],
  imports: [
    PrismaModule,
    AuthModule,
    AccessModule,
    GroupModule,
    ConsistencyModule,
  ],
  providers: [
    ItemTagService,
    // dataloaders
    ItemsByTagIdLoader,
    TagsByItemIdLoader,
    // resolver
    ItemTagResolver,
  ],
})
export class ItemTagModule {}
