import { Prisma } from '../../../generated/prisma/browser';
import Item from '../../item/entity/item.entity';

export class OnItemMergedEvent {
  workspaceId: number;
  actorId: number;
  hostItem: Item;
  mergingItem: Item;
  resultItem: Item;
  tx?: Prisma.TransactionClient;
}
