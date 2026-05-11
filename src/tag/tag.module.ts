import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { GroupModule } from '../group/group.module';
import { ItemTagModule } from '../item-tag/item-tag.module';
import { ItemsAggregationModule } from '../items-aggregation/items-aggregation.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TagByIdLoader } from './dataloader/tag-by-id.loader.service';
import { TagsByWorkspaceIdLoader } from './dataloader/tags-by-workspace-id.loader.service';
import { WorkspaceByTagIdLoader } from './dataloader/workspace-by-tag-id.loader.service';
import { TagMutationResolver } from './resolver/tag.mutation.resolver';
import { TagQueryResolver } from './resolver/tag.query.resolver';
import { TagWorkspaceFieldResolver } from './resolver/tag-workspace.field.resolver';
import { WorkspaceTagsFieldResolver } from './resolver/workspace-tags.field.resolver';
import { TagService } from './tag.service';

@Module({
  exports: [TagService, TagByIdLoader],
  imports: [
    PrismaModule,
    AuthModule,
    AccessModule,
    ItemTagModule,
    ItemsAggregationModule,
    GroupModule,
  ],
  providers: [
    TagService,
    // resolvers
    TagQueryResolver,
    TagMutationResolver,
    WorkspaceTagsFieldResolver,
    TagWorkspaceFieldResolver,
    // dataloaders
    TagsByWorkspaceIdLoader,
    TagByIdLoader,
    WorkspaceByTagIdLoader,
  ],
})
export class TagModule {}
