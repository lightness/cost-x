import { Module } from '@nestjs/common';
import { GroupModule } from '../group/group.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ItemsAggregationsByTagIdLoader } from './dataloader/items-aggregations-by-tag-id.loader.service';
import { ItemsAggregationsByWorkspaceIdLoader } from './dataloader/items-aggregations-by-workspace-id.loader.service';
import { ItemsAggregationService } from './items-aggregation.service';
import { ItemsAggregationResolver } from './resolver/items-aggregation.resolver';

@Module({
  exports: [
    ItemsAggregationsByTagIdLoader,
    ItemsAggregationsByWorkspaceIdLoader,
  ],
  imports: [PrismaModule, GroupModule],
  providers: [
    // service
    ItemsAggregationService,
    // resolver
    ItemsAggregationResolver,
    // dataloader
    ItemsAggregationsByTagIdLoader,
    ItemsAggregationsByWorkspaceIdLoader,
  ],
})
export class ItemsAggregationModule {}
