import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class WorkspaceInDto {
  @Field(() => String)
  title: string;
}