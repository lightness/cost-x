import { ArgsType, Field } from '@nestjs/graphql';
import { TagsFilter } from './tags-filter.type';

@ArgsType()
export class FindTagsArgs {
  @Field(() => TagsFilter, { nullable: true })
  filter?: TagsFilter;
}
