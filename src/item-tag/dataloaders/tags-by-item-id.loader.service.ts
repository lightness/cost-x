import { Injectable, Scope } from '@nestjs/common';
import { BaseLoader } from '../../graphql/dataloaders/base.loader';
import { PrismaService } from '../../prisma/prisma.service';
import Tag from '../../tag/entities/tag.entity';

@Injectable({ scope: Scope.REQUEST })
export class TagsByItemIdLoader extends BaseLoader<number, Tag[]> {
  constructor(private prisma: PrismaService) {
    super();
  }

  protected async loaderFn(itemIds: number[]): Promise<Tag[][]> {
    const itemTags = await this.prisma.itemTag.findMany({
      include: {
        tag: true,
      },
      where: {
        itemId: { in: itemIds },
      },
    });

    const tagsByItemId = itemIds.map((itemId) =>
      itemTags
        .filter((itemTag) => itemTag.itemId === itemId)
        .map((itemTag) => itemTag.tag),
    );

    return tagsByItemId;
  }
}
