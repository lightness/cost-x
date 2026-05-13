import { Module } from '@nestjs/common';
import { GroupModule } from '../group/group.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ItemsAggregationsByTagIdLoader } from './dataloader/items-aggregations-by-tag-id.loader.service';
import { ItemsAggregationsByWorkspaceIdLoader } from './dataloader/items-aggregations-by-workspace-id.loader.service';
import { ItemsAggregationService } from './items-aggregation.service';
import { ItemsAggregationFieldResolver } from './resolver/items-aggregation.field.resolver';
import { ItemsAggregationQueryResolver } from './resolver/items-aggregation.query.resolver';
import { TagItemsAggregationFieldResolver } from './resolver/tag-items-aggregation.field.resolver';
import { WorkspaceItemsAggregationFieldResolver } from './resolver/workspace-items-aggregation.field.resolver';

@Module({
  exports: [],
  imports: [PrismaModule, GroupModule],
  providers: [
    // service
    ItemsAggregationService,
    // resolver
    ItemsAggregationFieldResolver,
    ItemsAggregationQueryResolver,
    TagItemsAggregationFieldResolver,
    WorkspaceItemsAggregationFieldResolver,
    // dataloader
    ItemsAggregationsByTagIdLoader,
    ItemsAggregationsByWorkspaceIdLoader,
  ],
})
export class ItemsAggregationModule {}
