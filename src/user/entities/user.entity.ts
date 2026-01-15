import { Field, HideField, Int, ObjectType } from '@nestjs/graphql';
import {
  type User as PrismaUser,
  UserStatus,
} from '../../../generated/prisma/client';
import { DateIsoScalar } from '../../graphql/scalars';
import { UserRole } from './user-role.enum';

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

  @Field(() => UserRole)
  role: UserRole;

  @HideField()
  password: string;

  @HideField()
  tempCode: string | null;
}
