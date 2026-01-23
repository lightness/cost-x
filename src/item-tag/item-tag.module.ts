import { Module } from '@nestjs/common';
import { ItemTagService } from './item-tag.service';
import { ItemsByTagIdLoader } from './dataloaders/items-by-tag-id.loader.service';
import { TagsByItemIdLoader } from './dataloaders/tags-by-item-id.loader.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GroupModule } from '../group/group.module';
import { ItemTagResolver } from './resolver/item-tag.resolver';
import { ConsistencyModule } from '../consistency/consistency.module';
import { AuthModule } from '../auth/auth.module';
import { AccessModule } from '../access/access.module';

@Module({
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
  exports: [
    ItemTagService, 
    ItemsByTagIdLoader, 
    TagsByItemIdLoader,
  ],
})
export class ItemTagModule {}
