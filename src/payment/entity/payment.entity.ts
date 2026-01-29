import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Decimal } from '@prisma/client/runtime/client';
import {
  type Payment as PrismaPayment,
  Currency,
} from '../../../generated/prisma/client';
import { DateIsoScalar, DateScalar, DecimalScalar } from '../../graphql/scalar';
import Item from '../../item/entity/item.entity';

@ObjectType()
class Payment implements PrismaPayment {
  @Field(() => Int)
  id: number;

  @Field(() => DateIsoScalar, { nullable: true })
  createdAt: Date;

  @Field(() => DateIsoScalar, { nullable: true })
  updatedAt: Date;

  @Field(() => String, { nullable: true })
  title: string;

  @Field(() => DecimalScalar)
  cost: Decimal;

  @Field(() => Currency)
  currency: Currency;

  @Field(() => DateScalar)
  date: Date;

  @Field(() => Item, { nullable: true })
  item?: Item;

  @Field(() => Int)
  itemId: number;
}

export default Payment;
