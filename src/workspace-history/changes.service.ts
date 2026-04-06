import { Injectable } from '@nestjs/common';
import ItemTag from '../item-tag/entity/item-tag.entity';
import Item from '../item/entity/item.entity';
import Payment from '../payment/entity/payment.entity';
import Tag from '../tag/entity/tag.entity';
import { Workspace } from '../workspace/entity/workspace.entity';
import { WorkspaceHistoryAction } from './entity/workspace-history-action.enum';
import { WorkspaceHistory } from './entity/workspace-history.entity';

@Injectable()
export class ChangesService {
  getDiffByWorkspaceHistory(workspaceHistory: WorkspaceHistory) {
    switch (workspaceHistory.action) {
      case WorkspaceHistoryAction.ITEM_CREATED:
      case WorkspaceHistoryAction.ITEM_UPDATED:
      case WorkspaceHistoryAction.ITEM_DELETED:
        return this.getItemDiff(
          workspaceHistory.oldValue as unknown as Item,
          workspaceHistory.newValue as unknown as Item,
        );
      case WorkspaceHistoryAction.PAYMENT_CREATED:
      case WorkspaceHistoryAction.PAYMENT_UPDATED:
      case WorkspaceHistoryAction.PAYMENT_DELETED:
        return this.getPaymentDiff(
          workspaceHistory.oldValue as unknown as Payment,
          workspaceHistory.newValue as unknown as Payment,
        );
      case WorkspaceHistoryAction.ITEM_TAG_ASSIGNED:
      case WorkspaceHistoryAction.ITEM_TAG_UNASSIGNED:
        return this.getItemTagDiff(
          workspaceHistory.oldValue as unknown as ItemTag,
          workspaceHistory.newValue as unknown as ItemTag,
        );
      case WorkspaceHistoryAction.TAG_CREATED:
      case WorkspaceHistoryAction.TAG_UPDATED:
      case WorkspaceHistoryAction.TAG_DELETED:
        return this.getTagDiff(
          workspaceHistory.oldValue as unknown as Tag,
          workspaceHistory.newValue as unknown as Tag,
        );
      case WorkspaceHistoryAction.WORKSPACE_CREATED:
      case WorkspaceHistoryAction.WORKSPACE_UPDATED:
      case WorkspaceHistoryAction.WORKSPACE_DELETED:
        return this.getWorkspaceDiff(
          workspaceHistory.oldValue as unknown as Workspace,
          workspaceHistory.newValue as unknown as Workspace,
        );
      default:
        throw new Error(`Unsupported workspace history action: ${workspaceHistory.action}`);
    }
  }

  getDiff<O, N>(
    oldObject: O,
    newObject: N,
    whitelistedKeys?: (keyof O & keyof N)[],
  ): Record<string, { oldValue: unknown; newValue: unknown }> {
    const diff: Record<string, { oldValue: unknown; newValue: unknown }> = {};
    const allKeys = new Set([...Object.keys(oldObject || {}), ...Object.keys(newObject || {})]);

    for (const key of allKeys) {
      const oldVal = oldObject ? oldObject[key] : null;
      const newVal = newObject ? newObject[key] : null;

      if (oldVal !== newVal && (!whitelistedKeys || (whitelistedKeys as string[]).includes(key))) {
        diff[key] = { newValue: newVal, oldValue: oldVal };
      }
    }

    return diff;
  }

  getItemDiff(oldItem: Item, newItem: Item) {
    return this.getDiff(oldItem, newItem, ['title']);
  }

  getPaymentDiff(oldPayment: Payment, newPayment: Payment) {
    return this.getDiff(oldPayment, newPayment, ['title', 'cost', 'currency', 'date']);
  }

  getItemTagDiff(oldItemTag: ItemTag, newItemTag: ItemTag) {
    return this.getDiff(oldItemTag, newItemTag, ['itemId', 'tagId']);
  }

  getTagDiff(oldTag: Tag, newTag: Tag) {
    return this.getDiff(oldTag, newTag, ['title', 'color']);
  }

  getWorkspaceDiff(oldWorkspace: Workspace, newWorkspace: Workspace) {
    return this.getDiff(oldWorkspace, newWorkspace, ['title', 'defaultCurrency']);
  }
}
