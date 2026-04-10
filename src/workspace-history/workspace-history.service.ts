import { Injectable } from '@nestjs/common';
import { JsonObject } from '@prisma/client/runtime/client';
import { Prisma } from '../../generated/prisma/client';
import ItemTag from '../item-tag/entity/item-tag.entity';
import Item from '../item/entity/item.entity';
import Payment from '../payment/entity/payment.entity';
import { PrismaService } from '../prisma/prisma.service';
import Tag from '../tag/entity/tag.entity';
import { Workspace } from '../workspace/entity/workspace.entity';
import { WorkspaceHistoryFilter } from './dto/workspace-history-filter.type';
import { WorkspaceHistoryAction } from './entity/workspace-history-action.enum';
import { WorkspaceHistory } from './entity/workspace-history.entity';

@Injectable()
export class WorkspaceHistoryService {
  constructor(private prisma: PrismaService) {}

  async listByWorkspaceId(
    workspaceId: number,
    filter: WorkspaceHistoryFilter = {},
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory[]> {
    const workspaceHistoryEntries = await tx.workspaceHistory.findMany({
      orderBy: { createdAt: 'desc' },
      where: { id: filter.id, workspaceId },
    });

    return workspaceHistoryEntries;
  }

  async create(
    data: Omit<WorkspaceHistory, 'id' | 'createdAt'>,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    const workspaceHistory = await tx.workspaceHistory.create({
      data,
    });

    return workspaceHistory;
  }

  async createItemCreated(
    workspaceId: number,
    actorId: number,
    item: Item,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.ITEM_CREATED,
        actorId,
        newValue: item as unknown as JsonObject,
        oldValue: null,
        workspaceId,
      },
      tx,
    );
  }

  async createItemUpdated(
    workspaceId: number,
    actorId: number,
    oldItem: Item,
    newItem: Item,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.ITEM_UPDATED,
        actorId,
        newValue: newItem as unknown as JsonObject,
        oldValue: oldItem as unknown as JsonObject,
        workspaceId,
      },
      tx,
    );
  }

  async createItemDeleted(
    workspaceId: number,
    actorId: number,
    item: Item,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.ITEM_DELETED,
        actorId,
        newValue: null,
        oldValue: item as unknown as JsonObject,
        workspaceId,
      },
      tx,
    );
  }

  async createPaymentDeleted(
    workspaceId: number,
    actorId: number,
    payment: Payment,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.PAYMENT_DELETED,
        actorId,
        newValue: null,
        oldValue: payment as unknown as JsonObject,
        workspaceId,
      },
      tx,
    );
  }

  async createPaymentUpdated(
    workspaceId: number,
    actorId: number,
    oldPayment: Payment,
    newPayment: Payment,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.PAYMENT_UPDATED,
        actorId,
        newValue: newPayment as unknown as JsonObject,
        oldValue: oldPayment as unknown as JsonObject,
        workspaceId,
      },
      tx,
    );
  }

  async createPaymentCreated(
    workspaceId: number,
    actorId: number,
    payment: Payment,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.PAYMENT_CREATED,
        actorId,
        newValue: payment as unknown as JsonObject,
        oldValue: null,
        workspaceId,
      },
      tx,
    );
  }

  async createItemTagAssigned(
    workspaceId: number,
    actorId: number,
    itemTag: ItemTag,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.ITEM_TAG_ASSIGNED,
        actorId,
        newValue: itemTag as unknown as JsonObject,
        oldValue: null,
        workspaceId,
      },
      tx,
    );
  }

  async createItemTagUnassigned(
    workspaceId: number,
    actorId: number,
    itemTag: ItemTag,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.ITEM_TAG_UNASSIGNED,
        actorId,
        newValue: null,
        oldValue: itemTag as unknown as JsonObject,
        workspaceId,
      },
      tx,
    );
  }

  async createWorkspaceCreated(
    actorId: number,
    workspace: Workspace,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.WORKSPACE_CREATED,
        actorId,
        newValue: workspace as unknown as JsonObject,
        oldValue: null,
        workspaceId: workspace.id,
      },
      tx,
    );
  }

  async createWorkspaceUpdated(
    actorId: number,
    oldWorkspace: Workspace,
    newWorkspace: Workspace,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.WORKSPACE_UPDATED,
        actorId,
        newValue: newWorkspace as unknown as JsonObject,
        oldValue: oldWorkspace as unknown as JsonObject,
        workspaceId: newWorkspace.id,
      },
      tx,
    );
  }

  async createWorkspaceDeleted(
    actorId: number,
    workspace: Workspace,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.WORKSPACE_DELETED,
        actorId,
        newValue: null,
        oldValue: workspace as unknown as JsonObject,
        workspaceId: workspace.id,
      },
      tx,
    );
  }

  async createTagCreated(
    workspaceId: number,
    actorId: number,
    tag: Tag,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.TAG_CREATED,
        actorId,
        newValue: tag as unknown as JsonObject,
        oldValue: null,
        workspaceId,
      },
      tx,
    );
  }

  async createTagUpdated(
    workspaceId: number,
    actorId: number,
    oldTag: Tag,
    newTag: Tag,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.TAG_UPDATED,
        actorId,
        newValue: newTag as unknown as JsonObject,
        oldValue: oldTag as unknown as JsonObject,
        workspaceId,
      },
      tx,
    );
  }

  async createTagDeleted(
    workspaceId: number,
    actorId: number,
    tag: Tag,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.TAG_DELETED,
        actorId,
        newValue: null,
        oldValue: tag as unknown as JsonObject,
        workspaceId,
      },
      tx,
    );
  }

  async createItemExtracted(
    workspaceId: number,
    actorId: number,
    sourceItem: Item,
    extractedItem: Item,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.ITEM_EXTRACTED,
        actorId,
        newValue: { extractedItem, sourceItem } as unknown as JsonObject,
        oldValue: { extractedItem: null, sourceItem } as unknown as JsonObject,
        workspaceId,
      },
      tx,
    );
  }

  async createWorkspaceMemberJoined(
    workspaceId: number,
    actorId: number,
    inviteeId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.WORKSPACE_MEMBER_JOINED,
        actorId,
        newValue: { inviteeId } as unknown as JsonObject,
        oldValue: null,
        workspaceId,
      },
      tx,
    );
  }

  async createWorkspaceMemberRemoved(
    workspaceId: number,
    actorId: number,
    removedUserId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.WORKSPACE_MEMBER_REMOVED,
        actorId,
        newValue: null,
        oldValue: { removedUserId } as unknown as JsonObject,
        workspaceId,
      },
      tx,
    );
  }

  async createItemMerged(
    workspaceId: number,
    actorId: number,
    hostItem: Item,
    mergingItem: Item,
    resultItem: Item,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceHistory> {
    return this.create(
      {
        action: WorkspaceHistoryAction.ITEM_MERGED,
        actorId,
        newValue: { hostItem: resultItem, mergingItem: null } as unknown as JsonObject,
        oldValue: { hostItem, mergingItem } as unknown as JsonObject,
        workspaceId,
      },
      tx,
    );
  }
}
