import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import Item from '../../item/entity/item.entity';
import { PrismaService } from '../../prisma/prisma.service';
import Tag from '../../tag/entity/tag.entity';
import ItemTag from '../entity/item-tag.entity';

@Resolver(() => ItemTag)
export class ItemTagFieldResolver {
  constructor(private prisma: PrismaService) {}

  @ResolveField(() => Item)
  async item(@Parent() itemTag: ItemTag) {
    return this.prisma.item.findUnique({ where: { id: itemTag.itemId } });
  }

  @ResolveField(() => Tag)
  async tag(@Parent() itemTag: ItemTag) {
    return this.prisma.tag.findUnique({ where: { id: itemTag.tagId } });
  }
}
