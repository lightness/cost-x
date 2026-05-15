import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class WorkspaceUpdateInDto {
  @Field(() => String)
  title: string;
}
