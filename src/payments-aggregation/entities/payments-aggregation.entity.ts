import { Field, Float, HideField, Int, ObjectType } from '@nestjs/graphql';
import { PaymentsFilter } from '../../payment/dto';

@ObjectType()
export class PaymentsAggregation {

  @HideField()
  itemId: number;

  @HideField()
  paymentsFilter: PaymentsFilter;


  @Field(() => Int, { nullable: true })
  count?: number;

  @Field(() => Float, { nullable: true })
  costInDefaultCurrency?: number;
}