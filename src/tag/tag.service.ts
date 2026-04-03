import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TagInDto, TagsFilter } from './dto';
import Tag from './entity/tag.entity';

@Injectable()
export class TagService {
  constructor(private prisma: PrismaService) {}

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
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Tag> {
    return tx.tag.create({
      data: {
        ...dto,
        workspaceId,
      },
    });
  }

  async update(
    id: number,
    dto: TagInDto,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Tag> {
    // TODO: Select for update
    const tag = await tx.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new BadRequestException(`Tag #${id} does not exist`);
    }

    return tx.tag.update({
      data: {
        color: dto.color,
        title: dto.title,
      },
      where: { id },
    });
  }

  async delete(id: number, tx: Prisma.TransactionClient = this.prisma): Promise<void> {
    const tag = await tx.tag.findUnique({ where: { id } });

    if (!tag) {
      throw new BadRequestException(`Tag #${id} does not exist`);
    }

    await tx.tag.delete({ where: { id } });
  }
}
