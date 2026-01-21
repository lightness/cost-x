import { Field, InputType } from '@nestjs/graphql';
import { IsHexColor, IsOptional, IsString } from 'class-validator';

@InputType()
export class TagInDto {
  @Field(() => String)
  @IsString()
  title: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsHexColor()
  color?: string;
}
