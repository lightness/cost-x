import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthOutDto {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;
}
