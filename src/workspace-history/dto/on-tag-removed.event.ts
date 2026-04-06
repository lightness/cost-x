import { Prisma } from '../../../generated/prisma/browser';
import ItemTag from '../../item-tag/entity/item-tag.entity';

export class OnTagRemovedEvent {
  workspaceId: number;
  actorId: number;
  itemTag: ItemTag;
  tx?: Prisma.TransactionClient;
}
