import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { IsValidPassword } from '../../password/is-valid-password.decorator';

@InputType()
export class CreateUserInDto {
  @Field(() => String)
  @IsNotEmpty()
  name: string;

  @Field(() => String)
  @IsEmail()
  email: string;

  @Field(() => String)
  @IsValidPassword()
  password: string;
}
