import { ArgsType, Field } from '@nestjs/graphql';
import { PaymentsFilter } from './payments-filter.type';

@ArgsType()
export class FindPaymentsArgs {
  @Field(() => PaymentsFilter, { nullable: true })
  filter?: PaymentsFilter;
}
