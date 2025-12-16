import { Field, Float, ObjectType } from '@nestjs/graphql';
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
