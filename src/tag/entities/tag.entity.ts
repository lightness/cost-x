import { Field, HideField, Int, ObjectType } from '@nestjs/graphql';
import { Tag as PrismaTag } from '../../../generated/prisma/client';
import { DateIsoScalar } from '../../graphql/scalars';
import ItemTag from '../../item-tag/entities/item-tag.entity';
import Item from '../../item/entities/item.entity';

@ObjectType()
class Tag implements PrismaTag {
  @Field(() => Int)
  id: number;

  @Field(() => DateIsoScalar)
  createdAt: Date;

  @Field(() => DateIsoScalar)
  updatedAt: Date;

  @Field(() => String)
  title: string;

  @Field(() => String)
  color: string;

  @Field(() => [Item], { nullable: true })
  items?: Item[];
}

export default Tag;
