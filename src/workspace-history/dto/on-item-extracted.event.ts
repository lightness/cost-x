import { Prisma } from '../../../generated/prisma/browser';
import Item from '../../item/entity/item.entity';

export class OnItemExtractedEvent {
  workspaceId: number;
  actorId: number;
  sourceItem: Item;
  extractedItem: Item;
  tx?: Prisma.TransactionClient;
}
