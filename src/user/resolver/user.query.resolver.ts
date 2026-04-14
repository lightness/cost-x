import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Access2 } from '../../access/decorator/access2.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { Access2Guard } from '../../access/guard/access2.guard';
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
@UseGuards(AuthGuard, Access2Guard)
@UseInterceptors(GqlLoggingInterceptor)
export class UserQueryResolver {
  constructor(private userService: UserService) {}

  @Query(() => [User])
  @Access2.allow({ role: UserRole.ADMIN, targetScope: AccessScope.GLOBAL })
  async users() {
    return this.userService.list();
  }

  @Query(() => User)
  @Access2.allow({
    or: [
      { role: UserRole.USER, target: 'user', targetScope: AccessScope.USER },
      { role: UserRole.ADMIN, targetScope: AccessScope.GLOBAL },
    ],
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
