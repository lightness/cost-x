import { ArgsType, Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

@InputType()
export class ItemsFilter {
  @Field(() => [Int], { nullable: true })
  @IsOptional()
  tagIds?: number[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  title?: string;
}

@ArgsType()
export class GetItemsArgs {
  @Field(() => ItemsFilter, { nullable: true })
  @IsOptional()
  filter?: ItemsFilter;
}