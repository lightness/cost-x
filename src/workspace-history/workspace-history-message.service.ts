import { Injectable } from '@nestjs/common';
import { JsonValue } from '@prisma/client/runtime/client';
import { get } from 'radash';
import { WorkspaceHistoryAction } from './entity/workspace-history-action.enum';
import { WorkspaceHistory } from './entity/workspace-history.entity';

@Injectable()
export class WorkspaceHistoryMessageService {
  build(workspaceHistory: WorkspaceHistory, actorName: string): string {
    const { action, oldValue, newValue } = workspaceHistory;

    switch (action) {
      case WorkspaceHistoryAction.ITEM_CREATED:
        return `${actorName} created item #${this.extractId(newValue)} '${this.extractTitle(newValue)}'`;
      case WorkspaceHistoryAction.ITEM_UPDATED:
        return `${actorName} updated item #${this.extractId(oldValue)} '${this.extractTitle(oldValue)}'`;
      case WorkspaceHistoryAction.ITEM_DELETED:
        return `${actorName} deleted item #${this.extractId(oldValue)} '${this.extractTitle(oldValue)}'`;
      case WorkspaceHistoryAction.PAYMENT_CREATED:
        return `${actorName} recorded a payment`;
      case WorkspaceHistoryAction.PAYMENT_UPDATED:
        return `${actorName} updated a payment`;
      case WorkspaceHistoryAction.PAYMENT_DELETED:
        return `${actorName} deleted a payment`;
      case WorkspaceHistoryAction.TAG_ADDED:
        return `${actorName} added a tag`;
      case WorkspaceHistoryAction.TAG_REMOVED:
        return `${actorName} removed a tag`;
    }
  }

  private extract<T>(value: JsonValue | null, fieldPath: string): T {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const fieldValue = get(value as Record<string, JsonValue>, fieldPath);

      if (['string', 'number', 'boolean'].includes(typeof fieldValue)) {
        return fieldValue as T;
      }
    }

    return 'unknown' as T;
  }

  private extractTitle(value: JsonValue | null): string {
    return this.extract<string>(value, 'title');
  }

  private extractId(value: JsonValue | null): number {
    return this.extract<number>(value, 'id');
  }
}
