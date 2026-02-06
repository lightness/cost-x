import { Field, HideField, Int, ObjectType } from '@nestjs/graphql';
import { ItemsFilter } from '../../item/dto';
import { PaymentsFilter } from '../../payment/dto';
import { PaymentsAggregation } from '../../payments-aggregation/entity/payments-aggregation.entity';

@ObjectType()
export class ItemsAggregation {
  @HideField()
  itemIds: number[];

  @HideField()
  itemsFilter: ItemsFilter;

  @HideField()
  paymentsFilter: PaymentsFilter;

  @Field(() => Int, { nullable: true })
  count?: number;

  @Field(() => PaymentsAggregation, { nullable: true })
  paymentsAggregation?: PaymentsAggregation;
}
