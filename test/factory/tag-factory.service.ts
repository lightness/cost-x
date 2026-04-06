import { Injectable } from '@nestjs/common';
import Tag from '../../src/tag/entity/tag.entity';
import { PrismaService } from '../../src/prisma/prisma.service';

@Injectable()
export class TagFactoryService {
  constructor(private prisma: PrismaService) {}

  async create(workspaceId: number, overrides: Partial<{ title: string; color: string }> = {}): Promise<Tag> {
    return this.prisma.tag.create({
      data: {
        color: overrides.color ?? 'ffffff',
        title: overrides.title ?? `Tag ${Date.now()}`,
        workspaceId,
      },
    });
  }
}
