import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class RemoveUserBlockInDto {
  @Field(() => Int)
  blockerId: number;

  @Field(() => Int)
  blockedId: number;
}
