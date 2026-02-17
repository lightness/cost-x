import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class ResendConfirmEmailInDto {
  @Field(() => Int)
  userId: number;
}
