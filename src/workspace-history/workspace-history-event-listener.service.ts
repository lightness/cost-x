import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import {
  OnItemCreatedEvent,
  OnItemDeletedEvent,
  OnItemExtractedEvent,
  OnItemMergedEvent,
  OnItemStakesChangedEvent,
  OnItemUpdatedEvent,
  OnPaymentCreatedEvent,
  OnPaymentDeletedEvent,
  OnPaymentUpdatedEvent,
  OnTagAddedEvent,
  OnTagCreatedEvent,
  OnTagDeletedEvent,
  OnTagRemovedEvent,
  OnTagUpdatedEvent,
  OnWorkspaceCreatedEvent,
  OnWorkspaceDeletedEvent,
  OnWorkspaceInviteAcceptedEvent,
  OnWorkspaceInviteCancelledEvent,
  OnWorkspaceInviteCreatedEvent,
  OnWorkspaceInviteRejectedEvent,
  OnWorkspaceMemberCreatedEvent,
  OnWorkspaceMemberRemovedEvent,
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

  @OnEvent(WorkspaceHistoryEvent.WORKSPACE_INVITE_CREATED)
  async onWorkspaceInviteCreated({ tx = this.prisma, ...dto }: OnWorkspaceInviteCreatedEvent) {
    return this.workspaceHistoryService.createWorkspaceInviteCreated(
      dto.workspaceId,
      dto.actorId,
      dto.invite,
      tx,
    );
  }

  @OnEvent(WorkspaceHistoryEvent.WORKSPACE_INVITE_ACCEPTED)
  async onWorkspaceInviteAccepted({ tx = this.prisma, ...dto }: OnWorkspaceInviteAcceptedEvent) {
    return this.workspaceHistoryService.createWorkspaceInviteAccepted(
      dto.workspaceId,
      dto.actorId,
      dto.invite,
      tx,
    );
  }

  @OnEvent(WorkspaceHistoryEvent.WORKSPACE_INVITE_REJECTED)
  async onWorkspaceInviteRejected({ tx = this.prisma, ...dto }: OnWorkspaceInviteRejectedEvent) {
    return this.workspaceHistoryService.createWorkspaceInviteRejected(
      dto.workspaceId,
      dto.actorId,
      dto.invite,
      tx,
    );
  }

  @OnEvent(WorkspaceHistoryEvent.WORKSPACE_MEMBER_CREATED)
  async onWorkspaceMemberCreated({ tx = this.prisma, ...dto }: OnWorkspaceMemberCreatedEvent) {
    return this.workspaceHistoryService.createWorkspaceMemberCreated(
      dto.workspaceId,
      dto.actorId,
      dto.member,
      tx,
    );
  }

  @OnEvent(WorkspaceHistoryEvent.WORKSPACE_MEMBER_REMOVED)
  async onWorkspaceMemberRemoved({ tx = this.prisma, ...dto }: OnWorkspaceMemberRemovedEvent) {
    return this.workspaceHistoryService.createWorkspaceMemberRemoved(
      dto.workspaceId,
      dto.actorId,
      dto.member,
      tx,
    );
  }

  @OnEvent(WorkspaceHistoryEvent.WORKSPACE_INVITE_CANCELLED)
  async onWorkspaceInviteCancelled({ tx = this.prisma, ...dto }: OnWorkspaceInviteCancelledEvent) {
    return this.workspaceHistoryService.createWorkspaceInviteCancelled(
      dto.workspaceId,
      dto.actorId,
      dto.invite,
      tx,
    );
  }

  @OnEvent(WorkspaceHistoryEvent.ITEM_STAKES_CHANGED)
  async onItemStakesChanged({ tx = this.prisma, ...dto }: OnItemStakesChangedEvent) {
    return this.workspaceHistoryService.createItemStakesChanged(
      dto.workspaceId,
      dto.actorId,
      dto.oldValue,
      dto.newValue,
      tx,
    );
  }
}
