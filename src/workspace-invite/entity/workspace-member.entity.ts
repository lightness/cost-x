import { Field, Int, ObjectType } from '@nestjs/graphql';
import { WorkspaceMember as PrismaWorkspaceMember } from '../../../generated/prisma/client';
import { Permission } from '../../access/entity/permission.enum';
import { DateIsoScalar } from '../../graphql/scalar';

@ObjectType()
export class WorkspaceMember implements PrismaWorkspaceMember {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  workspaceId: number;

  @Field(() => Int)
  userId: number;

  @Field(() => [Permission])
  permissions: Permission[];

  @Field(() => DateIsoScalar)
  joinedAt: Date;

  @Field(() => DateIsoScalar, { nullable: true })
  leftAt: Date | null;
}
