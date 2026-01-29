import { Field, InputType } from '@nestjs/graphql';
import { Currency } from '../../currency-rate/entities/currency.enum';

@InputType()
export class WorkspacesFilter {
  @Field(() => String, { nullable: true })
  title?: string;

  @Field(() => Currency, { nullable: true })
  defaultCurrency?: Currency;
}
