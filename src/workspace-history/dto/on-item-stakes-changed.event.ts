import { StakeRule } from '../../../generated/prisma/browser';
import ItemStake from '../../item-stake/entity/item-stake.entity';
import { BaseWorkspaceHistoryEvent } from './base-workspace-history.event';

export class ItemStakesChangedEventPayload {
  stakeRule: StakeRule;
  stakes: ItemStake[];
  itemId: number;
}

export class OnItemStakesChangedEvent extends BaseWorkspaceHistoryEvent<ItemStakesChangedEventPayload> {}
