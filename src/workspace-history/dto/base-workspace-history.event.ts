import { Prisma } from '../../../generated/prisma/client';

export class BaseWorkspaceHistoryEvent<T> {
  workspaceId: number;
  actorId: number;
  newValue: T | null;
  oldValue: T | null;
  tx?: Prisma.TransactionClient;
}
