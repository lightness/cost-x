import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Currency } from '../../database/entities/currency.enum';
import { DateScalar } from '../scalars/date.scalar';
import ItemEntity from './item.entity';
import { Payment } from '../../database/entities';
import { DateIsoScalar } from '../scalars';

@ObjectType()
class PaymentEntity {
  @Field(() => Int)
  id: number;

  @Field(() => DateIsoScalar, { nullable: true })
  createdAt: Date;

  @Field(() => DateIsoScalar, { nullable: true })
  updatedAt: Date;

  @Field({ nullable: true })
  title: string;

  @Field()
  cost: number;

  @Field(() => Currency)
  currency: Currency;

  @Field(() => DateScalar)
  date: Date;

  // @Field(() => ItemEntity)
  // item: ItemEntity;

  itemId: number;
}

export default PaymentEntity;
