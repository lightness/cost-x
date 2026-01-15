import { Injectable, Scope } from '@nestjs/common';
import { BaseLoader } from '../../graphql/dataloaders/base.loader';
import type { PrismaService } from '../../prisma/prisma.service';
import type Item from '../../item/entities/item.entity';

@Injectable({ scope: Scope.REQUEST })
export class ItemsByTagIdLoader extends BaseLoader<number, Item[]> {
  constructor(private prisma: PrismaService) {
    super();
  }

  protected async loaderFn(tagIds: number[]): Promise<Item[][]> {
    const itemTags = await this.prisma.itemTag.findMany({
      where: {
        tagId: { in: tagIds },
      },
      include: {
        item: true,
      },
    });

    const itemsByTagId = tagIds.map((tagId) =>
      itemTags
        .filter((itemTag) => itemTag.tagId === tagId)
        .map((itemTag) => itemTag.item),
    );

    return itemsByTagId;
  }
}
