import { Field, Float, InputType, Int } from '@nestjs/graphql';

@InputType()
export class MemberStake {
  @Field(() => Int)
  workspaceMemberId: number;

  @Field(() => Float)
  value: number;
}
