import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StringChangeOutDto {
  @Field(() => String, { nullable: true })
  oldValue: string | null;

  @Field(() => String, { nullable: true })
  newValue: string | null;
}
