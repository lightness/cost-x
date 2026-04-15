import { Prisma } from '../../../generated/prisma/browser';
import { WorkspaceMember } from '../../workspace-membership/entity/workspace-member.entity';

export class OnMemberJoinedEvent {
  actorId: number;
  workspaceId: number;
  member: WorkspaceMember;
  tx?: Prisma.TransactionClient;
}
