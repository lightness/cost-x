import { Field, Int, ObjectType } from '@nestjs/graphql';
import { WorkspaceInvite as PrismaWorkspaceInvite } from '../../../generated/prisma/client';
import { Permission } from '../../access/entity/permission.enum';
import { DateIsoScalar } from '../../graphql/scalar';
import { WorkspaceInviteStatus } from './workspace-invite-status.enum';

@ObjectType()
export class WorkspaceInvite implements PrismaWorkspaceInvite {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  workspaceId: number;

  @Field(() => Int)
  inviterId: number;

  @Field(() => Int)
  inviteeId: number;

  @Field(() => WorkspaceInviteStatus)
  status: WorkspaceInviteStatus;

  @Field(() => [Permission])
  permissions: Permission[];

  @Field(() => DateIsoScalar)
  createdAt: Date;

  @Field(() => DateIsoScalar, { nullable: true })
  reactedAt: Date | null;
}
