import { Field, Int, ObjectType } from '@nestjs/graphql';
import { UserBlock as PrismaUserBlock } from '../../../generated/prisma/client';
import { DateIsoScalar } from '../../graphql/scalar';

@ObjectType()
export class UserBlock implements PrismaUserBlock {
  @Field(() => Int)
  id: number;

  @Field(() => DateIsoScalar)
  createdAt: Date;

  @Field(() => Int)
  blockerId: number;

  @Field(() => Int)
  blockedId: number;

  @Field(() => DateIsoScalar, { nullable: true })
  removedAt: Date;

  @Field(() => Int, { nullable: true })
  removedByUserId: number;
}
