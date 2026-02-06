import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class AssignTagInDto {
  @Field(() => Int)
  tagId: number;

  @Field(() => Int)
  itemId: number;
}
