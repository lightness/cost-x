import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class GetItemsArgs {
  @Field(() => String, { nullable: true })
  title: string;

  // @Field(() => [Int], { nullable: true })
  // tagIds: number[];
}