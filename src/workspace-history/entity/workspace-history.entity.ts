import { Field, Int, ObjectType } from '@nestjs/graphql';
import { JsonValue } from '@prisma/client/runtime/client';
import {
  WorkspaceHistory as PrismaWorkspaceHistory,
  WorkspaceHistoryAction,
} from '../../../generated/prisma/client';
import { DateIsoScalar, JsonScalar } from '../../graphql/scalar';

@ObjectType()
export class WorkspaceHistory implements PrismaWorkspaceHistory {
  @Field(() => Int)
  id: number;

  @Field(() => DateIsoScalar)
  createdAt: Date;

  @Field(() => Int)
  workspaceId: number;

  @Field(() => Int)
  actorId: number;

  @Field(() => WorkspaceHistoryAction)
  action: WorkspaceHistoryAction;

  @Field(() => JsonScalar, { nullable: true })
  oldValue: JsonValue | null;

  @Field(() => JsonScalar, { nullable: true })
  newValue: JsonValue | null;
}
