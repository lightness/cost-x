import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { Tag as PrismaTag } from '../../../generated/prisma/client';
import { DateIsoScalar } from '../../graphql/scalars';
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
