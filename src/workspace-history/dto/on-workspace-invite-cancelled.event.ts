import { Prisma } from '../../../generated/prisma/browser';
import { WorkspaceInvite } from '../../workspace-membership/entity/workspace-invite.entity';

export class OnWorkspaceInviteCancelledEvent {
  actorId: number;
  workspaceId: number;
  invite: WorkspaceInvite;
  tx?: Prisma.TransactionClient;
}
