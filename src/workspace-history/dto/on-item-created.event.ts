import { Prisma } from '../../../generated/prisma/browser';
import Item from '../../item/entity/item.entity';

export class OnItemCreatedEvent {
  workspaceId: number;
  actorId: number;
  item: Item;
  tx?: Prisma.TransactionClient;
}
