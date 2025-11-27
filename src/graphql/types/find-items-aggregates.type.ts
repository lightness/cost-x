import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import ItemEntity from '../entities/item.entity';
import { CostByCurrency } from './cost-by-currency.type';

@ObjectType()
export class FindItemsAggregates {
  items: ItemEntity[];

  @Field(() => Int, { nullable: true })
  count?: number;

  @Field(() => CostByCurrency, { nullable: true })
  costByCurrency?: CostByCurrency;

  @Field(() => Float, { nullable: true })
  costInDefaultCurrency?: number;
}