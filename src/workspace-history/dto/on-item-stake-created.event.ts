import { Prisma } from '../../../generated/prisma/browser';
import ItemStake from '../../item-stake/entity/item-stake.entity';

export class OnItemStakeCreatedEvent {
  workspaceId: number;
  actorId: number;
  itemStake: ItemStake;
  tx?: Prisma.TransactionClient;
}
