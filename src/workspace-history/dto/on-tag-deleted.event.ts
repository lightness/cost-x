import { Prisma } from '../../../generated/prisma/browser';
import Tag from '../../tag/entity/tag.entity';

export class OnTagDeletedEvent {
  workspaceId: number;
  actorId: number;
  tag: Tag;
  tx?: Prisma.TransactionClient;
}
