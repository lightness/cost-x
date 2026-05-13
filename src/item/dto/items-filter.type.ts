import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class ItemsFilter {
  @Field(() => [Int], { nullable: true })
  tagIds?: number[];

  @Field(() => String, { nullable: true })
  title?: string;

  @Field(() => [Int], { nullable: true })
  ids?: number[];
}
