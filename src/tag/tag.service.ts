import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import User from '../user/entity/user.entity';
import { WorkspaceHistoryEvent } from '../workspace-history/entity/workspace-history-event.enum';
import { TagInDto, TagsFilter } from './dto';
import Tag from './entity/tag.entity';

@Injectable()
export class TagService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getById(id: number): Promise<Tag | null> {
    const tag = await this.prisma.tag.findFirst({
      where: { id },
    });

    return tag;
  }

  async listByWorkspaceIds(
    workspaceIds: number[],
    query: TagsFilter,
  ): Promise<Tag[]> {
    const { title } = query || {};

    const tags = await this.prisma.tag.findMany({
      where: {
        title: title ? { contains: title, mode: 'insensitive' } : undefined,
        workspaceId: { in: workspaceIds },
      },
    });

    return tags;
  }

  async create(
    workspaceId: number,
    dto: TagInDto,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Tag> {
    const tag = await tx.tag.create({
      data: {
        ...dto,
        workspaceId,
      },
    });

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.TAG_CREATED, {
      actorId: currentUser.id,
      tag,
      tx,
      workspaceId,
    });

    return tag;
  }

  async update(
    id: number,
    dto: TagInDto,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Tag> {
    // TODO: Select for update
    const oldTag = await tx.tag.findUnique({ where: { id } });

    if (!oldTag) {
      throw new BadRequestException(`Tag #${id} does not exist`);
    }

    const newTag = await tx.tag.update({
      data: {
        color: dto.color,
        title: dto.title,
      },
      where: { id },
    });

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.TAG_UPDATED, {
      actorId: currentUser.id,
      newTag,
      oldTag,
      tx,
      workspaceId: oldTag.workspaceId,
    });

    return newTag;
  }

  async delete(
    id: number,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    const tag = await tx.tag.findUnique({ where: { id } });

    if (!tag) {
      throw new BadRequestException(`Tag #${id} does not exist`);
    }

    await tx.tag.delete({ where: { id } });

    await this.eventEmitter.emitAsync(WorkspaceHistoryEvent.TAG_DELETED, {
      actorId: currentUser.id,
      tag,
      tx,
      workspaceId: tag.workspaceId,
    });
  }
}
