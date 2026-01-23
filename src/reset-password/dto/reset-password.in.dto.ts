import { Field, InputType } from '@nestjs/graphql';
import { IsJWT, IsString } from 'class-validator';

@InputType()
export class ResetPasswordInDto {
  @IsJWT()
  @Field()
  token: string;

  @IsString()
  @Field()
  password: string;
}
