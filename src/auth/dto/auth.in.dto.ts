import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AuthInDto {
  @Field()
  email: string;

  @Field()
  password: string;
}
