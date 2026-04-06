import { Prisma } from '../../../generated/prisma/browser';
import Item from '../../item/entity/item.entity';

export class OnItemUpdatedEvent {
  workspaceId: number;
  actorId: number;
  oldItem: Item;
  newItem: Item;
  tx?: Prisma.TransactionClient;
}
