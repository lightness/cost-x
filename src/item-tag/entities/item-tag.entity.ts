import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ItemTag as PrismaItemTag } from '../../../generated/prisma/client';
import { DateIsoScalar } from '../../graphql/scalars';
import Item from '../../item/entities/item.entity';
import Tag from '../../tag/entities/tag.entity';

@ObjectType()
class ItemTag implements PrismaItemTag {
  @Field(() => Int) 
  id: number;

  @Field(() => DateIsoScalar)
  createdAt: Date;

  @Field(() => DateIsoScalar)
  updatedAt: Date;

  @Field(() => Item, { nullable: true })
  item?: Item;

  @Field(() => Int)
  itemId: number;

  @Field(() => Item, { nullable: true })
  tag?: Tag;

  @Field(() => Int)
  tagId: number;
}

export default ItemTag;
