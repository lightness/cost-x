import { Prisma } from '../../../generated/prisma/browser';
import ItemStake from '../../item-stake/entity/item-stake.entity';

export class OnItemStakeUpdatedEvent {
  workspaceId: number;
  actorId: number;
  newItemStake: ItemStake;
  oldItemStake: ItemStake;
  tx?: Prisma.TransactionClient;
}
