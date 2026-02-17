import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ResendEmailOutDto {
  @Field(() => Boolean)
  success: boolean;
}
