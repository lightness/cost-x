import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Item as PrismaItem } from '../../../generated/prisma/client';
import { DateIsoScalar } from '../../graphql/scalar';
import Payment from '../../payment/entity/payment.entity';
import { PaymentsAggregation } from '../../payments-aggregation/entity/payments-aggregation.entity';
import Tag from '../../tag/entity/tag.entity';
import { Workspace } from '../../workspace/entity/workspace.entity';

@ObjectType()
class Item implements PrismaItem {
  @Field(() => Int)
  id: number;

  @Field(() => DateIsoScalar)
  createdAt: Date;

  @Field(() => DateIsoScalar)
  updatedAt: Date;

  @Field()
  title: string;

  @Field(() => Int)
  workspaceId: number;

  @Field(() => Workspace, { nullable: true })
  workspace?: Workspace;

  @Field(() => [Payment], { nullable: true })
  payments?: Payment[];

  @Field(() => PaymentsAggregation, { nullable: true })
  paymentsAggregation?: PaymentsAggregation;

  @Field(() => [Tag], { nullable: true })
  tags?: Tag[];
}

export default Item;
