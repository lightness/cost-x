import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class WorkspacesFilter {
  @Field(() => String, { nullable: true })
  title?: string;
}
