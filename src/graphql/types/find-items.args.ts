import { ArgsType, Field } from '@nestjs/graphql';
import { ItemsFilter } from './items-filter.type';

@ArgsType()
export class FindItemsArgs {
  @Field(() => ItemsFilter, { nullable: true })
  filter?: ItemsFilter;
}