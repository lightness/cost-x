import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { ConsistencyModule } from '../consistency/consistency.module';
import { GroupModule } from '../group/group.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ItemsByTagIdLoader } from './dataloader/items-by-tag-id.loader.service';
import { TagsByItemIdLoader } from './dataloader/tags-by-item-id.loader.service';
import { ItemTagService } from './item-tag.service';
import { ItemTagFieldResolver } from './resolver/item-tag.field.resolver';
import { ItemTagMutationResolver } from './resolver/item-tag.mutation.resolver';
import { ItemTagsFieldResolver } from './resolver/item-tags.field.resolver';
import { TagItemsFieldResolver } from './resolver/tag-items.field.resolver';

@Module({
  exports: [ItemTagService],
  imports: [PrismaModule, AuthModule, AccessModule, GroupModule, ConsistencyModule],
  providers: [
    ItemTagService,
    // dataloaders
    ItemsByTagIdLoader,
    TagsByItemIdLoader,
    // resolvers
    ItemTagFieldResolver,
    ItemTagMutationResolver,
    ItemTagsFieldResolver,
    TagItemsFieldResolver,
  ],
})
export class ItemTagModule {}
