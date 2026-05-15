import { Field, InputType } from '@nestjs/graphql';
import { IsJWT } from 'class-validator';
import { IsValidPassword } from '../../password/is-valid-password.decorator';

@InputType()
export class ResetPasswordInDto {
  @IsJWT()
  @Field()
  token: string;

  @IsValidPassword()
  @Field()
  password: string;
}
