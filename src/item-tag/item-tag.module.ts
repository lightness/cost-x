import { forwardRef, Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { ConsistencyModule } from '../consistency/consistency.module';
import { GroupModule } from '../group/group.module';
import { ItemModule } from '../item/item.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TagByIdLoader } from '../tag/dataloader/tag-by-id.loader.service';
import { ItemsByTagIdLoader } from './dataloader/items-by-tag-id.loader.service';
import { TagsByItemIdLoader } from './dataloader/tags-by-item-id.loader.service';
import { ItemTagService } from './item-tag.service';
import { ItemTagItemFieldResolver } from './resolver/item-tag-item.field.resolver';
import { ItemTagMutationResolver } from './resolver/item-tag.mutation.resolver';
import { ItemTagTagFieldResolver } from './resolver/item-tag-tag.field.resolver';
import { ItemTagsFieldResolver } from './resolver/item-tags.field.resolver';
import { TagItemsFieldResolver } from './resolver/tag-items.field.resolver';

@Module({
  exports: [ItemTagService],
  imports: [
    PrismaModule,
    AuthModule,
    AccessModule,
    GroupModule,
    ConsistencyModule,
    forwardRef(() => ItemModule),
  ],
  providers: [
    ItemTagService,
    // dataloaders
    ItemsByTagIdLoader,
    TagsByItemIdLoader,
    TagByIdLoader,
    // resolvers
    ItemTagMutationResolver,
    ItemTagsFieldResolver,
    TagItemsFieldResolver,
    ItemTagItemFieldResolver,
    ItemTagTagFieldResolver,
  ],
})
export class ItemTagModule {}
