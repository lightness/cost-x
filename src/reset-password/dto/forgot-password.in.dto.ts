import { Field, InputType } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';

@InputType()
export class ForgotPasswordInDto {
  @IsEmail()
  @Field()
  email: string;
}
