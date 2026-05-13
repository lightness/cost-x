import { StakeRule } from '../../workspace-stake/entity/stake-rule.enum';
import ItemStake from '../../item-stake/entity/item-stake.entity';
import { BaseWorkspaceHistoryEvent } from './base-workspace-history.event';

export class ItemStakesChangedEventPayload {
  stakeRule: StakeRule;
  stakes: ItemStake[];
  itemId: number;
}

export class OnItemStakesChangedEvent extends BaseWorkspaceHistoryEvent<ItemStakesChangedEventPayload> {}
