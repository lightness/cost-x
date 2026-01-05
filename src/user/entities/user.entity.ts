import { Field, HideField, Int, ObjectType } from '@nestjs/graphql';
import { User as PrismaUser, UserStatus } from '../../../generated/prisma/client';
import { DateIsoScalar } from '../../graphql/scalars';

@ObjectType()
export class User implements PrismaUser {
  @Field(() => Int)
  id: number;

  @Field(() => DateIsoScalar)
  createdAt: Date;

  @Field(() => DateIsoScalar)
  updatedAt: Date;

  @Field(() => String)
  name: string;

  @Field(() => String)
  email: string;

  @Field(() => UserStatus)
  status: UserStatus;

  @HideField()
  password: string;

  @HideField()
  tempCode: string | null;
}