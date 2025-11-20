import { ArgsType, Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

@InputType()
export class TagsFilter {
  @Field({ nullable: true })
  @IsOptional()
  title: string;
}

@ArgsType()
export class FindTagsArgs {
  @Field(() => TagsFilter, { nullable: true })
  @IsOptional()
  filter?: TagsFilter;
}