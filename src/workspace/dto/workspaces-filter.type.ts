import { Field, InputType, Int } from '@nestjs/graphql';
import { Currency } from '../../currency-rate/entity/currency.enum';

@InputType()
export class WorkspacesFilter {
  @Field(() => Int, { nullable: true })
  id?: number;

  @Field(() => String, { nullable: true })
  title?: string;

  @Field(() => Currency, { nullable: true })
  defaultCurrency?: Currency;
}
