import { Prisma } from '../../../generated/prisma/client';

export interface OnWorkspaceMemberJoinedEvent {
  actorId: number;
  inviteeId: number;
  workspaceId: number;
  tx?: Prisma.TransactionClient;
}
