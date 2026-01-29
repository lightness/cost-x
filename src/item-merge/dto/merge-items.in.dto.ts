import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt } from 'class-validator';

@InputType()
export class MergeItemsInDto {
  @Field(() => Int)
  @IsInt()
  hostItemId: number;

  @Field(() => Int)
  @IsInt()
  mergingItemId: number;
}
