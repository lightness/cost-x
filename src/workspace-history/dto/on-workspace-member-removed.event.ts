import { Prisma } from '../../../generated/prisma/client';

export interface OnWorkspaceMemberRemovedEvent {
  actorId: number;
  removedUserId: number;
  workspaceId: number;
  tx?: Prisma.TransactionClient;
}
