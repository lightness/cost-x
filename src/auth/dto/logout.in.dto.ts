import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class LogoutInDto {
  @Field()
  refreshToken: string;
}
