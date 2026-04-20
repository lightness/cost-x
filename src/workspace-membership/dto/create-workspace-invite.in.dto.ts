import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateWorkspaceInviteInDto {
  @Field(() => Int)
  workspaceId: number;

  @Field(() => Int)
  inviterId: number;

  @Field(() => Int)
  inviteeId: number;
}
