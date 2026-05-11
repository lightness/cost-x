import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { type ItemStake as PrismaItemStake } from '../../../generated/prisma/client';
import { DateIsoScalar } from '../../graphql/scalar';
import Item from '../../item/entity/item.entity';
import { WorkspaceMember } from '../../workspace-membership/entity/workspace-member.entity';

@ObjectType()
class ItemStake implements PrismaItemStake {
  @Field(() => Int)
  id: number;

  @Field(() => DateIsoScalar)
  createdAt: Date;

  @Field(() => DateIsoScalar)
  updatedAt: Date;

  @Field(() => Int)
  itemId: number;

  @Field(() => Item, { nullable: true })
  item?: Item;

  @Field(() => Int)
  workspaceMemberId: number;

  @Field(() => WorkspaceMember, { nullable: true })
  workspaceMember?: WorkspaceMember;

  @Field(() => Float)
  value: number;
}

export default ItemStake;
