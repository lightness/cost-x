import { Field, ObjectType } from '@nestjs/graphql';
import PaymentEntity from '../entities/payment.entity';
import { FindPaymentsAggregates } from './find-payments-aggregates.type';

@ObjectType()
export class FindPaymentsResponse {
  @Field(() => [PaymentEntity], { nullable: true })
  data?: PaymentEntity[];

  @Field(() => FindPaymentsAggregates, { nullable: true })
  aggregates?: FindPaymentsAggregates;
}