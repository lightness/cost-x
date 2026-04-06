import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsString } from 'class-validator';

@InputType()
export class ExtractAsItemInDto {
  @Field(() => Int)
  @IsInt()
  itemId: number;

  @Field(() => [Int])
  @IsInt({ each: true })
  paymentIds: number[];

  @Field()
  @IsString()
  title: string;
}
