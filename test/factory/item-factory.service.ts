import { Injectable } from '@nestjs/common';
import Item from '../../src/item/entity/item.entity';
import { PrismaService } from '../../src/prisma/prisma.service';

@Injectable()
export class ItemFactoryService {
  constructor(private prisma: PrismaService) {}

  async create(workspaceId: number, overrides: Partial<{ title: string }> = {}): Promise<Item> {
    return this.prisma.item.create({
      data: {
        title: overrides.title ?? `Item ${Date.now()}`,
        workspaceId,
      },
    });
  }
}
