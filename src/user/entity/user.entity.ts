import { Field, HideField, Int, ObjectType } from '@nestjs/graphql';
import { type User as PrismaUser } from '../../../generated/prisma/client';
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

  @Field(() => Boolean)
  isEmailVerified?: boolean;

  @Field(() => Boolean)
  isBanned: boolean;

  @Field(() => UserRole)
  role: UserRole;

  @HideField()
  password: string;

  @HideField()
  confirmEmailTempCode: string | null;

  @HideField()
  resetPasswordTempCode: string | null;
}

export default User;
