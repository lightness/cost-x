import { Field, HideField, Int, ObjectType } from '@nestjs/graphql';
import { type User as PrismaUser } from '../../../generated/prisma/client';
import { UserStatus } from './user-status.enum';
import { DateIsoScalar } from '../../graphql/scalar';
import { UserRole } from './user-role.enum';

@ObjectType()
class User implements PrismaUser {
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

  @Field(() => Boolean)
  isBanned: boolean;

  @Field(() => UserRole)
  role: UserRole;

  @HideField()
  password: string;

  @HideField()
  tempCode: string | null;
}

export default User;
