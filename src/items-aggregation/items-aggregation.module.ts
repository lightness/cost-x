import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item, Payment } from '../database/entities';
import { ItemsAggregationService } from './items-aggregation.service';
import { ItemsAggregationResolver } from './resolvers/items-aggregation.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Item, Payment])],
  providers: [
    // service
    ItemsAggregationService,
    // resolver
    ItemsAggregationResolver,
  ],
})
export class ItemsAggregationModule {}
