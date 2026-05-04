import { Field, Int, ObjectType } from '@nestjs/graphql';
import { WorkspaceMember as PrismaWorkspaceMember } from '../../../generated/prisma/client';
import { DateIsoScalar } from '../../graphql/scalar';

@ObjectType()
export class WorkspaceMember implements PrismaWorkspaceMember {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  workspaceId: number;

  @Field(() => Int)
  userId: number;

  @Field(() => Int)
  inviteId: number;

  @Field(() => DateIsoScalar)
  joinedAt: Date;

  @Field(() => DateIsoScalar, { nullable: true })
  removedAt: Date;

  @Field(() => Int, { nullable: true })
  removedByUserId: number;
}
