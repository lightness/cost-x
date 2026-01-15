import type Item from '../../item/entities/item.entity';
import type Tag from '../../tag/entities/tag.entity';
import type { ItemTag as PrismaItemTag } from '../../../generated/prisma/client';

class ItemTag implements PrismaItemTag {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  item?: Item;
  itemId: number;
  tag?: Tag;
  tagId: number;
}

export default ItemTag;
