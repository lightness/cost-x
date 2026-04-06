import { Prisma } from '../../../generated/prisma/browser';
import { Workspace } from '../../workspace/entity/workspace.entity';

export class OnWorkspaceUpdatedEvent {
  actorId: number;
  oldWorkspace: Workspace;
  newWorkspace: Workspace;
  tx?: Prisma.TransactionClient;
}
