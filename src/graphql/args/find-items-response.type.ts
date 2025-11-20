import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Item } from '../../database/entities';
import { Currency } from '../../database/entities/currency.enum';

@ObjectType()
export class CostByCurrency {
  @Field(() => Float)
  [Currency.BYN]: number;

  @Field(() => Float)
  [Currency.USD]: number;

  @Field(() => Float)
  [Currency.EUR]: number;
}

@ObjectType()
export class FindItemsAggregates {
  @Field(() => Int)
  count: number;

  @Field(() => CostByCurrency)
  costByCurrency: CostByCurrency;

  @Field(() => Float)
  costInDefaultCurrency: number;
}

@ObjectType()
export class FindItemsResponse {
  @Field(() => [Item])
  data: Item[];

  @Field(() => FindItemsAggregates)
  aggregates: FindItemsAggregates;
}
