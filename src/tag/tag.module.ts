import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { GroupModule } from '../group/group.module';
import { ItemTagModule } from '../item-tag/item-tag.module';
import { ItemsAggregationModule } from '../items-aggregation/items-aggregation.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TagsByWorkspaceIdLoader } from './dataloader/tags-by-workspace-id.loader.service';
import { TagResolver } from './resolver/tag.resolver';
import { TagService } from './tag.service';

@Module({
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
    TagResolver,
    // dataloaders
    TagsByWorkspaceIdLoader,
  ],
  exports: [
    TagService,
    TagsByWorkspaceIdLoader,
  ],
})
export class TagModule { }
