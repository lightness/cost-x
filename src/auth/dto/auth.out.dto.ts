import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthOutDto {
  @Field()
  accessToken: string;

  @Field(() => String, { nullable: true })
  refreshToken?: string;
}
