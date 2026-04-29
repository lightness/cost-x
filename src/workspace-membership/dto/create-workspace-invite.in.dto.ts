import { Field, InputType, Int } from '@nestjs/graphql';
import { WorkspacePermission } from '../../access/interfaces';

@InputType()
export class CreateWorkspaceInviteInDto {
  @Field(() => Int)
  workspaceId: number;

  @Field(() => Int)
  inviterId: number;

  @Field(() => Int)
  inviteeId: number;

  @Field(() => [WorkspacePermission], { defaultValue: [] })
  permissions: WorkspacePermission[];
}
