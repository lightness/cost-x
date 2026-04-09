import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope, PermissionLevel } from '../../access/interfaces';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { GqlLoggingInterceptor } from '../../graphql/interceptor/gql-logging.interceptor';
import { Permission } from '../../access/interfaces';
import User from '../entity/user.entity';
import { UserService } from '../user.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(GqlLoggingInterceptor)
export class UserQueryResolver {
  constructor(private userService: UserService) {}

  @Query(() => [User])
  @Access.allow([{ level: PermissionLevel.ADMIN, permission: Permission.USER_LIST }])
  async users() {
    return this.userService.list();
  }

  @Query(() => User)
  @Access.allow([
    {
      and: [
        { targetId: fromArg('id'), targetScope: AccessScope.USER },
        { level: PermissionLevel.OWNER, permission: Permission.USER_READ },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.USER_READ },
  ])
  async user(@Args('id', { type: () => Int }) id: number) {
    return this.userService.getById(id);
  }

  @Query(() => User)
  async me(@CurrentUser() currentUser: User) {
    return currentUser;
  }
}
