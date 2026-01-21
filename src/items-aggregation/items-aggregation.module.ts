import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ItemsAggregationsByTagIdLoader } from './dataloaders/items-aggregations-by-tag-id.loader.service';
import { ItemsAggregationService } from './items-aggregation.service';
import { ItemsAggregationResolver } from './resolvers/items-aggregation.resolver';

@Module({
  imports: [PrismaModule],
  providers: [
    // service
    ItemsAggregationService,
    // resolver
    ItemsAggregationResolver,
    // dataloader
    ItemsAggregationsByTagIdLoader,
  ],
  exports: [
    ItemsAggregationsByTagIdLoader,
  ]
})
export class ItemsAggregationModule {}
