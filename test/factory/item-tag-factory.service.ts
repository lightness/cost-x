import { Injectable } from '@nestjs/common';
import ItemTag from '../../src/item-tag/entity/item-tag.entity';
import { PrismaService } from '../../src/prisma/prisma.service';

@Injectable()
export class ItemTagFactoryService {
  constructor(private prisma: PrismaService) {}

  async create(itemId: number, tagId: number): Promise<ItemTag> {
    return this.prisma.itemTag.create({ data: { itemId, tagId } });
  }
}
