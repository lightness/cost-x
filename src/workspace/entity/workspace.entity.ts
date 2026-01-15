import { Field, Int, ObjectType } from '@nestjs/graphql';
import type { Workspace as PrismaWorkspace } from '../../../generated/prisma/client';
import { DateIsoScalar } from '../../graphql/scalars';

@ObjectType()
export class Workspace implements PrismaWorkspace {
  @Field(() => Int)
  id: number;

  @Field(() => DateIsoScalar)
  createdAt: Date;

  @Field(() => DateIsoScalar)
  updatedAt: Date;

  @Field(() => String)
  title: string;

  @Field(() => Int)
  ownerId: number;
}
