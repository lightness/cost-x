import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import {
  OnItemCreatedEvent,
  OnItemDeletedEvent,
  OnItemExtractedEvent,
  OnItemUpdatedEvent,
  OnMemberJoinedEvent,
  OnPaymentCreatedEvent,
  OnPaymentDeletedEvent,
  OnPaymentUpdatedEvent,
  OnTagAddedEvent,
  OnTagRemovedEvent,
  OnItemMergedEvent,
  OnTagCreatedEvent,
  OnTagDeletedEvent,
  OnTagUpdatedEvent,
  OnWorkspaceCreatedEvent,
  OnWorkspaceDeletedEvent,
  OnWorkspaceUpdatedEvent,
} from './dto';
import { WorkspaceHistoryEvent } from './entity/workspace-history-event.enum';
import { WorkspaceHistoryService } from './workspace-history.service';

@Injectable()
export class WorkspaceHistoryEventListenerService {
  constructor(
    private prisma: PrismaService,
    private workspaceHistoryService: WorkspaceHistoryService,
  ) {}

  @OnEvent(WorkspaceHistoryEvent.ITEM_CREATED)
  async onItemCreated({ tx = this.prisma, ...dto }: OnItemCreatedEvent) {
    return this.workspaceHistoryService.createItemCreated(
      dto.workspaceId,
      dto.actorId,
      dto.item,
      tx,
    );
  }

  @OnEvent(WorkspaceHistoryEvent.ITEM_UPDATED)
  async onItemUpdated({ tx = this.prisma, ...dto }: OnItemUpdatedEvent) {
    return this.workspaceHistoryService.createItemUpdated(
      dto.workspaceId,
      dto.actorId,
      dto.oldItem,
      dto.newItem,
      tx,
    );
  }

  @OnEvent(WorkspaceHistoryEvent.ITEM_DELETED)
  async onItemDeleted({ tx = this.prisma, ...dto }: OnItemDeletedEvent) {
    return this.workspaceHistoryService.createItemDeleted(
      dto.workspaceId,
      dto.actorId,
      dto.item,
      tx,
    );
  }

  @OnEvent(WorkspaceHistoryEvent.PAYMENT_DELETED)
  async onPaymentDeleted({ tx = this.prisma, ...dto }: OnPaymentDeletedEvent) {
    return this.workspaceHistoryService.createPaymentDeleted(
      dto.workspaceId,
      dto.actorId,
      dto.payment,
      tx,
    );
  }

  @OnEvent(WorkspaceHistoryEvent.PAYMENT_UPDATED)
  async onPaymentUpdated({ tx = this.prisma, ...dto }: OnPaymentUpdatedEvent) {
    return this.workspaceHistoryService.createPaymentUpdated(
      dto.workspaceId,
      dto.actorId,
      dto.oldPayment,
      dto.newPayment,
      tx,
    );
  }

  @OnEvent(WorkspaceHistoryEvent.PAYMENT_CREATED)
  async onPaymentCreated({ tx = this.prisma, ...dto }: OnPaymentCreatedEvent) {
    return this.workspaceHistoryService.createPaymentCreated(
      dto.workspaceId,
      dto.actorId,
      dto.payment,
      tx,
    );
  }

  @OnEvent(WorkspaceHistoryEvent.ITEM_TAG_ASSIGNED)
  async onItemTagAssigned({ tx = this.prisma, ...dto }: OnTagAddedEvent) {
    return this.workspaceHistoryService.createItemTagAssigned(
      dto.workspaceId,
      dto.actorId,
      dto.itemTag,
      tx,
    );
  }

  @OnEvent(WorkspaceHistoryEvent.ITEM_TAG_UNASSIGNED)
  async onItemTagUnassigned({ tx = this.prisma, ...dto }: OnTagRemovedEvent) {
    return this.workspaceHistoryService.createItemTagUnassigned(
      dto.workspaceId,
      dto.actorId,
      dto.itemTag,
      tx,
    );
  }

  @OnEvent(WorkspaceHistoryEvent.ITEM_EXTRACTED)
  async onItemExtracted({ tx = this.prisma, ...dto }: OnItemExtractedEvent) {
    return this.workspaceHistoryService.createItemExtracted(
      dto.workspaceId,
      dto.actorId,
      dto.sourceItem,
      dto.extractedItem,
      tx,
    );
  }

  @OnEvent(WorkspaceHistoryEvent.ITEM_MERGED)
  async onItemMerged({ tx = this.prisma, ...dto }: OnItemMergedEvent) {
    return this.workspaceHistoryService.createItemMerged(
      dto.workspaceId,
      dto.actorId,
      dto.hostItem,
      dto.mergingItem,
      dto.resultItem,
      tx,
    );
  }

  @OnEvent(WorkspaceHistoryEvent.TAG_CREATED)
  async onTagCreated({ tx = this.prisma, ...dto }: OnTagCreatedEvent) {
    return this.workspaceHistoryService.createTagCreated(dto.workspaceId, dto.actorId, dto.tag, tx);
  }

  @OnEvent(WorkspaceHistoryEvent.TAG_UPDATED)
  async onTagUpdated({ tx = this.prisma, ...dto }: OnTagUpdatedEvent) {
    return this.workspaceHistoryService.createTagUpdated(
      dto.workspaceId,
      dto.actorId,
      dto.oldTag,
      dto.newTag,
      tx,
    );
  }

  @OnEvent(WorkspaceHistoryEvent.TAG_DELETED)
  async onTagDeleted({ tx = this.prisma, ...dto }: OnTagDeletedEvent) {
    return this.workspaceHistoryService.createTagDeleted(dto.workspaceId, dto.actorId, dto.tag, tx);
  }

  @OnEvent(WorkspaceHistoryEvent.WORKSPACE_CREATED)
  async onWorkspaceCreated({ tx = this.prisma, ...dto }: OnWorkspaceCreatedEvent) {
    return this.workspaceHistoryService.createWorkspaceCreated(dto.actorId, dto.workspace, tx);
  }

  @OnEvent(WorkspaceHistoryEvent.WORKSPACE_UPDATED)
  async onWorkspaceUpdated({ tx = this.prisma, ...dto }: OnWorkspaceUpdatedEvent) {
    return this.workspaceHistoryService.createWorkspaceUpdated(
      dto.actorId,
      dto.oldWorkspace,
      dto.newWorkspace,
      tx,
    );
  }

  @OnEvent(WorkspaceHistoryEvent.WORKSPACE_DELETED)
  async onWorkspaceDeleted({ tx = this.prisma, ...dto }: OnWorkspaceDeletedEvent) {
    return this.workspaceHistoryService.createWorkspaceDeleted(dto.actorId, dto.workspace, tx);
  }

  @OnEvent(WorkspaceHistoryEvent.MEMBER_JOINED)
  async onMemberJoined({ tx = this.prisma, ...dto }: OnMemberJoinedEvent) {
    return this.workspaceHistoryService.createMemberJoined(
      dto.workspaceId,
      dto.actorId,
      dto.member,
      tx,
    );
  }
}
