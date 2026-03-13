import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateInviteInDto {
  @Field(() => Int)
  inviterUserId: number;

  @Field(() => Int)
  inviteeUserId: number;
}
