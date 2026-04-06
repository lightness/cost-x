import { Injectable } from '@nestjs/common';
import { JsonValue } from '@prisma/client/runtime/client';
import { get } from 'radash';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceHistoryAction } from './entity/workspace-history-action.enum';
import { WorkspaceHistory } from './entity/workspace-history.entity';

@Injectable()
export class WorkspaceHistoryMessageService {
  constructor(private prisma: PrismaService) {}

  async build(workspaceHistory: WorkspaceHistory, actorName: string): Promise<string> {
    const { action, oldValue, newValue } = workspaceHistory;

    switch (action) {
      case WorkspaceHistoryAction.ITEM_CREATED:
        return `${actorName} created item #${this.extractId(newValue)} '${this.extractTitle(newValue)}'`;
      case WorkspaceHistoryAction.ITEM_UPDATED:
        return `${actorName} updated item #${this.extractId(oldValue)} '${this.extractTitle(oldValue)}'`;
      case WorkspaceHistoryAction.ITEM_DELETED:
        return `${actorName} deleted item #${this.extractId(oldValue)} '${this.extractTitle(oldValue)}'`;
      case WorkspaceHistoryAction.PAYMENT_CREATED:
        return `${actorName} recorded a payment #${this.extractId(newValue)} '${this.extractTitle(newValue)}'`;
      case WorkspaceHistoryAction.PAYMENT_UPDATED:
        return `${actorName} updated a payment #${this.extractId(oldValue)} '${this.extractTitle(oldValue)}'`;
      case WorkspaceHistoryAction.PAYMENT_DELETED:
        return `${actorName} deleted a payment #${this.extractId(oldValue)} '${this.extractTitle(oldValue)}'`;
      case WorkspaceHistoryAction.TAG_CREATED:
        return `${actorName} created tag #${this.extractId(newValue)} '${this.extractTitle(newValue)}'`;
      case WorkspaceHistoryAction.TAG_UPDATED:
        return `${actorName} updated tag #${this.extractId(oldValue)} '${this.extractTitle(oldValue)}'`;
      case WorkspaceHistoryAction.TAG_DELETED:
        return `${actorName} deleted tag #${this.extractId(oldValue)} '${this.extractTitle(oldValue)}'`;
      case WorkspaceHistoryAction.ITEM_TAG_ASSIGNED:
        return `${actorName} assigned a tag #${this.extractTagId(newValue)} '${await this.extractTagTitle(newValue)}' to item #${this.extractItemId(newValue)} '${await this.extractItemTitle(newValue)}'`;
      case WorkspaceHistoryAction.ITEM_TAG_UNASSIGNED:
        return `${actorName} unassigned a tag #${this.extractTagId(oldValue)} '${await this.extractTagTitle(oldValue)}' from item #${this.extractItemId(oldValue)} '${await this.extractItemTitle(oldValue)}'`;
      case WorkspaceHistoryAction.ITEM_MERGED:
        return `${actorName} merged item #${this.extract<number>(oldValue, 'mergingItem.id')} '${this.extract<string>(oldValue, 'mergingItem.title')}' into item #${this.extract<number>(newValue, 'hostItem.id')} '${this.extract<string>(newValue, 'hostItem.title')}'`;
      case WorkspaceHistoryAction.WORKSPACE_CREATED:
        return `${actorName} created workspace #${this.extractId(newValue)} '${this.extractTitle(newValue)}'`;
      case WorkspaceHistoryAction.WORKSPACE_UPDATED:
        return `${actorName} updated workspace #${this.extractId(oldValue)} '${this.extractTitle(oldValue)}'`;
      case WorkspaceHistoryAction.WORKSPACE_DELETED:
        return `${actorName} deleted workspace #${this.extractId(oldValue)} '${this.extractTitle(oldValue)}'`;
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

  private extractItemId(value: JsonValue | null): number {
    return this.extract<number>(value, 'itemId');
  }

  private extractTagId(value: JsonValue | null): number {
    return this.extract<number>(value, 'tagId');
  }

  private async extractTagTitle(value: JsonValue | null): Promise<string> {
    const tagId = this.extractTagId(value);

    if (typeof tagId === 'number') {
      const tag = await this.prisma.tag.findUnique({
        where: { id: tagId },
      });

      return tag ? tag.title : 'unknown';
    }

    return 'unknown';
  }

  private async extractItemTitle(value: JsonValue | null): Promise<string> {
    const itemId = this.extractItemId(value);

    if (typeof itemId === 'number') {
      const item = await this.prisma.item.findUnique({
        where: { id: itemId },
      });

      return item ? item.title : 'unknown';
    }

    return 'unknown';
  }
}
