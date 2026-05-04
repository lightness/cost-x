import { Prisma } from '../../../generated/prisma/browser';
import { WorkspaceInvite } from '../../workspace-membership/entity/workspace-invite.entity';

export class OnWorkspaceInviteCreatedEvent {
  actorId: number;
  workspaceId: number;
  invite: WorkspaceInvite;
  tx?: Prisma.TransactionClient;
}
