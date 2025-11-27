import { Field, ObjectType } from '@nestjs/graphql';
import ItemEntity from '../entities/item.entity';
import { FindItemsAggregates } from './find-items-aggregates.type';

@ObjectType()
export class FindItemsResponse {
  @Field(() => [ItemEntity], { nullable: true })
  data?: ItemEntity[];

  @Field(() => FindItemsAggregates, { nullable: true })
  aggregates?: FindItemsAggregates;
}
