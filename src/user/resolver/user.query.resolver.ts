import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope } from '../../access/interfaces';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { Infer } from '../../common/decorator/infer.decorator';
import { UserByIdPipe } from '../../common/pipe/user-by-id.pipe';
import { GqlLoggingInterceptor } from '../../graphql/interceptor/gql-logging.interceptor';
import { UserRole } from '../entity/user-role.enum';
import User from '../entity/user.entity';
import { UserService } from '../user.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(GqlLoggingInterceptor)
export class UserQueryResolver {
  constructor(private userService: UserService) {}

  @Query(() => [User])
  @Access.allow({ role: UserRole.ADMIN, scope: AccessScope.USER })
  async users() {
    return this.userService.list();
  }

  @Query(() => User)
  @Access.allow({
    or: [{ self: 'user' }, { role: UserRole.ADMIN, scope: AccessScope.USER }],
  })
  @Infer('user', { from: fromArg('id'), pipes: [UserByIdPipe] })
  async user(@Args('id', { type: () => Int }) id: number) {
    return this.userService.getById(id);
  }

  @Query(() => User)
  async me(@CurrentUser() currentUser: User) {
    return currentUser;
  }
}
