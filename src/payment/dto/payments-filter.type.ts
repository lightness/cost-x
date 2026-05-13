import { Field, InputType, Int } from '@nestjs/graphql';
import { DateScalar } from '../../graphql/scalar';

@InputType()
export class PaymentsFilter {
  @Field(() => DateScalar, { nullable: true })
  dateFrom?: Date;

  @Field(() => DateScalar, { nullable: true })
  dateTo?: Date;

  @Field(() => [Int], { nullable: true })
  ids?: number[];
}
