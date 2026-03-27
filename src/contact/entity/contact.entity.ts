import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Contact as PrismaContact } from '../../../generated/prisma/client';
import { DateIsoScalar } from '../../graphql/scalar';

@ObjectType()
export class Contact implements PrismaContact {
  @Field(() => Int)
  id: number;

  @Field(() => DateIsoScalar)
  createdAt: Date;

  @Field(() => Int)
  sourceUserId: number;

  @Field(() => Int)
  targetUserId: number;

  @Field(() => Int)
  inviteId: number;

  @Field(() => DateIsoScalar, { nullable: true })
  removedAt: Date;

  @Field(() => Int)
  removedByUserId: number;
}
