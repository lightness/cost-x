import { BadRequestException, Injectable } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import type { ListTagQueryDto, TagInDto, TagOutDto } from './dto';
import type Tag from './entities/tag.entity';

@Injectable()
export class TagService {
  constructor(private prisma: PrismaService) {}

  async getById(id: number): Promise<Tag | null> {
    const tag = await this.prisma.tag.findFirst({ where: { id } });

    return tag;
  }

  async list(query: ListTagQueryDto): Promise<Tag[]> {
    const { title } = query || {};

    const tags = await this.prisma.tag.findMany({
      where: {
        title: title ? { contains: title, mode: 'insensitive' } : undefined,
      },
    });

    return tags;
  }

  async create(dto: TagInDto): Promise<Tag> {
    const tag = await this.prisma.tag.create({ data: dto });

    return tag;
  }

  async update(id: number, dto: TagInDto): Promise<TagOutDto> {
    return this.prisma.$transaction(async (tx) => {
      // TODO: Select for update
      const tag = await tx.tag.findUnique({
        where: { id },
      });

      if (!tag) {
        throw new BadRequestException(`Tag #${id} does not exist`);
      }

      return this.prisma.tag.update({
        where: { id },
        data: {
          title: dto.title,
          color: dto.color,
        },
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
