import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class PaymentsFilter {
  @Field(() => Date, { nullable: true })
  dateFrom?: Date;

  @Field(() => Date, { nullable: true })
  dateTo?: Date;
}