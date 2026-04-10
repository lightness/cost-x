import { Field, InputType, Int } from '@nestjs/graphql';
import { Permission } from '../../access/entity/permission.enum';

@InputType()
export class CreateWorkspaceInviteInDto {
  @Field(() => Int)
  workspaceId: number;

  @Field(() => Int)
  inviteeUserId: number;

  @Field(() => [Permission])
  permissions: Permission[];
}
