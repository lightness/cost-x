import { Field, InputType } from '@nestjs/graphql';
import { DateScalar } from '../../graphql/scalars';

@InputType()
export class PaymentsFilter {
  @Field(() => DateScalar, { nullable: true })
  dateFrom?: Date;

  @Field(() => DateScalar, { nullable: true })
  dateTo?: Date;
}