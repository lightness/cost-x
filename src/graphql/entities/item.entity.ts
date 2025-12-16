import { Field, Int, ObjectType } from '@nestjs/graphql';
import { DateIsoScalar } from '../scalars';
import { FindPaymentsResponse } from '../types/find-payments-response.type';
import TagEntity from './tag.entity';

@ObjectType()
class ItemEntity {
  @Field(() => Int)
  id: number;

  @Field(() => DateIsoScalar)
  createdAt: Date;

  @Field(() => DateIsoScalar)
  updatedAt: Date;

  @Field()
  title: string;

  @Field(() => FindPaymentsResponse)
  payments: FindPaymentsResponse;

  @Field(() => [TagEntity])
  tags: TagEntity[];
}

export default ItemEntity;
