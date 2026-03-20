import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateUserBlockInDto {
  @Field(() => Int)
  blockerId: number;

  @Field(() => Int)
  blockedId: number;
}
