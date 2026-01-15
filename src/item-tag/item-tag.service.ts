import { BadRequestException, Injectable } from '@nestjs/common';
import Item from '../item/entities/item.entity';
import { PrismaService } from '../prisma/prisma.service';
import Tag from '../tag/entities/tag.entity';
import ItemTag from './entities/item-tag.entity';

@Injectable()
export class ItemTagService {
  constructor(private prisma: PrismaService) {}

  async setTag(item: Item, tag: Tag): Promise<ItemTag> {
    const itemTag = await this.prisma.itemTag.findFirst({
      where: {
        itemId: item.id,
        tagId: tag.id,
      },
    });

    if (itemTag) {
      throw new BadRequestException(
        `Item #${item.id} already has tag #${tag.id}`,
      );
    }

    return this.prisma.itemTag.create({
      data: {
        item: { connect: { id: item.id } },
        tag: { connect: { id: tag.id } },
      },
    });
  }

  async removeTag(item: Item, tag: Tag): Promise<void> {
    const itemTag = await this.prisma.itemTag.findUnique({
      where: {
        itemId_tagId: {
          itemId: item.id,
          tagId: tag.id,
        },
      },
    });

    if (!itemTag) {
      throw new BadRequestException(
        `Item #${item.id} does not have tag #${tag.id}`,
      );
    }

    await this.prisma.itemTag.delete({
      where: {
        itemId_tagId: {
          itemId: item.id,
          tagId: tag.id,
        },
      },
    });
  }
}
