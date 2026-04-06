import { Prisma } from '../../../generated/prisma/browser';
import { Workspace } from '../../workspace/entity/workspace.entity';

export class OnWorkspaceCreatedEvent {
  actorId: number;
  workspace: Workspace;
  tx?: Prisma.TransactionClient;
}
