import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { OnItemCreatedEvent, OnItemDeletedEvent, OnItemUpdatedEvent, OnPaymentCreatedEvent, OnPaymentDeletedEvent, OnPaymentUpdatedEvent } from './dto';
import { WorkspaceHistoryService } from './workspace-history.service';

@Injectable()
export class WorkspaceHistoryEventListenerService {
  constructor(
    private prisma: PrismaService,
    private workspaceHistoryService: WorkspaceHistoryService,
  ) {}

  @OnEvent('item.created')
  async onItemCreated({ tx = this.prisma, ...dto }: OnItemCreatedEvent) {
    return this.workspaceHistoryService.createItemCreated(
      dto.workspaceId,
      dto.actorId,
      dto.item,
      tx,
    );
  }

  @OnEvent('item.updated')
  async onItemUpdated({ tx = this.prisma, ...dto }: OnItemUpdatedEvent) {
    return this.workspaceHistoryService.createItemUpdated(
      dto.workspaceId,
      dto.actorId,
      dto.oldItem,
      dto.newItem,
      tx,
    );
  }

  @OnEvent('item.deleted')
  async onItemDeleted({ tx = this.prisma, ...dto }: OnItemDeletedEvent) {
    return this.workspaceHistoryService.createItemDeleted(
      dto.workspaceId,
      dto.actorId,
      dto.item,
      tx,
    );
  }

  @OnEvent('payment.deleted')
  async onPaymentDeleted({ tx = this.prisma, ...dto }: OnPaymentDeletedEvent) {
    return this.workspaceHistoryService.createPaymentDeleted(
      dto.workspaceId,
      dto.actorId,
      dto.payment,
      tx,
    );
  }

  @OnEvent('payment.updated')
  async onPaymentUpdated({ tx = this.prisma, ...dto }: OnPaymentUpdatedEvent) {
    return this.workspaceHistoryService.createPaymentUpdated(
      dto.workspaceId,
      dto.actorId,
      dto.oldPayment,
      dto.newPayment,
      tx,
    );
  }

  @OnEvent('payment.created')
  async onPaymentCreated({ tx = this.prisma, ...dto }: OnPaymentCreatedEvent) {
    return this.workspaceHistoryService.createPaymentCreated(
      dto.workspaceId,
      dto.actorId,
      dto.payment,
      tx,
    );
  }
}
