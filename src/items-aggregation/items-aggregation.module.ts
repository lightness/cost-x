import { Module } from '@nestjs/common';
import { GroupModule } from '../group/group.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ItemsAggregationsByTagIdLoader } from './dataloaders/items-aggregations-by-tag-id.loader.service';
import { ItemsAggregationsByWorkspaceIdLoader } from './dataloaders/items-aggregations-by-workspace-id.loader.service';
import { ItemsAggregationService } from './items-aggregation.service';
import { ItemsAggregationResolver } from './resolvers/items-aggregation.resolver';

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
