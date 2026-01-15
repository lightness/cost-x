import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ItemInDto {
  @Field(() => String)
  title: string;
}
