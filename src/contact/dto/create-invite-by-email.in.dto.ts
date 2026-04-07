import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';

@InputType()
export class CreateInviteByEmailInDto {
  @Field(() => Int)
  inviterUserId: number;

  @Field(() => String)
  @IsEmail()
  inviteeEmail: string;
}
