import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class LogoutOutDto {
  @Field()
  success: boolean;
}
