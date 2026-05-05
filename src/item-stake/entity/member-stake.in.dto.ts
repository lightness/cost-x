import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MemberStake {
  @Field(() => Int)
  workspaceMemberId: number;

  @Field(() => Float)
  value: number;
}
