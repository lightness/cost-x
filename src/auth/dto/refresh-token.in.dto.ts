import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class RefreshTokenInDto {
  @Field()
  refreshToken: string;
}
