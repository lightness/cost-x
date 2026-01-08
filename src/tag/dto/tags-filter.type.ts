import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class TagsFilter {
  @Field({ nullable: true })
  title?: string;
}
