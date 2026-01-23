import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TagsFilter, TagInDto } from './dto';
import Tag from './entities/tag.entity';

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

  async create(workspaceId: number, dto: TagInDto): Promise<Tag> {
    const tag = await this.prisma.tag.create({
      data: {
        ...dto,
        workspaceId,
      },
    });

    return tag;
  }

  async update(id: number, dto: TagInDto): Promise<Tag> {
    return this.prisma.$transaction(async (tx) => {
      // TODO: Select for update
      const tag = await tx.tag.findUnique({
        where: { id },
      });

      if (!tag) {
        throw new BadRequestException(`Tag #${id} does not exist`);
      }

      return this.prisma.tag.update({
        data: {
          color: dto.color,
          title: dto.title,
        },
        where: { id },
      });
    });
  }

  async delete(id: number): Promise<void> {
    const tag = await this.prisma.tag.findUnique({ where: { id } });

    if (!tag) {
      throw new BadRequestException(`Tag #${id} does not exist`);
    }

    await this.prisma.tag.delete({ where: { id } });
  }
}
