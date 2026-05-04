import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Access } from '../decorator/access.decorator';
import { AccessGuard } from '../guard/access.guard';
import { AccessScope } from '../interfaces';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { UserByIdPipe } from '../../common/pipe/user-by-id.pipe';
import { GqlLoggingInterceptor } from '../../graphql/interceptor/gql-logging.interceptor';
import { UserRole } from '../../user/entity/user-role.enum';
import User from '../../user/entity/user.entity';
import { UserPermission } from '../entity/user-permission.entity';
import { UserPermissionService } from '../user-permission.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(GqlLoggingInterceptor)
export class UserPermissionQueryResolver {
  constructor(private userPermissionService: UserPermissionService) {}

  @Query(() => [UserPermission])
  @Access.allow({ role: UserRole.ADMIN, scope: AccessScope.USER })
  async userPermissions(
    @Args('userId', { type: () => Int }, UserByIdPipe) user: User,
  ): Promise<UserPermission[]> {
    return this.userPermissionService.listByUserId(user.id);
  }
}
