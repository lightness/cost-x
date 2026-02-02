import { Field, InputType } from '@nestjs/graphql';
import { Currency } from '../../currency-rate/entity/currency.enum';

@InputType()
export class WorkspaceInDto {
  @Field(() => String)
  title: string;

  @Field(() => Currency)
  defaultCurrency: Currency;
}
