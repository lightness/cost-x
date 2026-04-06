import { Prisma } from '../../../generated/prisma/browser';
import Tag from '../../tag/entity/tag.entity';

export class OnTagUpdatedEvent {
  workspaceId: number;
  actorId: number;
  oldTag: Tag;
  newTag: Tag;
  tx?: Prisma.TransactionClient;
}
