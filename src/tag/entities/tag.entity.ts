import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Tag as PrismaTag } from '../../../generated/prisma/client';
import { DateIsoScalar } from '../../graphql/scalars';
import Item from '../../item/entities/item.entity';
import { Workspace } from '../../workspace/entity/workspace.entity';
import { ItemsAggregation } from '../../items-aggregation/entities/items-aggregation.entity';

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

  @Field(() => Int)
  workspaceId: number;

  @Field(() => Workspace, { nullable: true })
  workspace?: Workspace;

  @Field(() => [Item], { nullable: true })
  items?: Item[];

  @Field(() => ItemsAggregation, { nullable: true })
  itemsAggregation?: ItemsAggregation;
}

export default Tag;
