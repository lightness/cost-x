import { Field, Int, ObjectType } from '@nestjs/graphql';
import { UserPermissionModel } from '../../../generated/prisma/models';
import { DateIsoScalar } from '../../graphql/scalar';
import { Permission } from '../permission.enum';

@ObjectType()
export class UserPermission implements UserPermissionModel {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  userId: number;

  @Field(() => Permission)
  permission: Permission;

  @Field(() => DateIsoScalar)
  grantedAt: Date;
}
