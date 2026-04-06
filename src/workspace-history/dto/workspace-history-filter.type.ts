import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class WorkspaceHistoryFilter {
  @Field(() => Int, { nullable: true })
  id?: number;
}
