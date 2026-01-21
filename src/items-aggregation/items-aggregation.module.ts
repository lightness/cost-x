import { Module } from '@nestjs/common';
import { ItemsAggregationService } from './items-aggregation.service';
import { ItemsAggregationResolver } from './resolvers/items-aggregation.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    // service
    ItemsAggregationService,
    // resolver
    ItemsAggregationResolver,
  ],
  exports: [
    ItemsAggregationService,
  ]
})
export class ItemsAggregationModule {}
