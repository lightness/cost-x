import { UseGuards, UseInterceptors } from '@nestjs/common';
import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope } from '../../access/interfaces';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { WorkspacesByUserIdLoader } from '../../workspace/dataloader/workspaces-by-user-id.loader';
import { WorkspacesFilter } from '../../workspace/dto';
import { Workspace } from '../../workspace/entity/workspace.entity';
import { CreateUserInDto, UpdateUserInDto } from '../dto';
import { UserRole } from '../entities/user-role.enum';
import { User } from '../entities/user.entity';
import { UserService } from '../user.service';
import { GqlLoggingInterceptor } from '../../graphql/interceptors/gql-logging.interceptor';
import { UserByIdPipe } from '../../common/pipes/user-by-id.pipe';

@Resolver(() => User)
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(GqlLoggingInterceptor)
export class UserResolver {
  constructor(
    private userService: UserService,
    private workspacesByUserIdLoader: WorkspacesByUserIdLoader,
  ) {}

  @ResolveField(() => [Workspace])
  async workspaces(
    @Parent() user: User,
    @Args('workspacesFilter', { nullable: true }) filters: WorkspacesFilter,
  ) {
    const userWorkspaces = this.workspacesByUserIdLoader
      .withOptions(filters)
      .load(user.id);

    return userWorkspaces;
  }

  @Query(() => [User])
  @Access.allow([{ role: UserRole.ADMIN, targetScope: AccessScope.GLOBAL }])
  async users() {
    return this.userService.list();
  }

  @Query(() => User)
  @Access.allow([
    {
      role: UserRole.USER,
      targetId: fromArg('id'),
      targetScope: AccessScope.USER,
    },
    { role: UserRole.ADMIN, targetScope: AccessScope.GLOBAL },
  ])
  async user(@Args('id', { type: () => Int }) id: number) {
    return this.userService.getById(id);
  }

  @Query(() => User)
  async me(@CurrentUser() currentUser: User) {
    return currentUser;
  }

  @Mutation(() => User)
  async createUser(
    @Args('dto', { type: () => CreateUserInDto }) dto: CreateUserInDto,
  ) {
    return this.userService.create(dto);
  }

  @Mutation(() => User)
  @Access.allow([
    {
      role: UserRole.USER,
      targetId: fromArg('id'),
      targetScope: AccessScope.USER,
    },
    { role: UserRole.ADMIN, targetScope: AccessScope.GLOBAL },
  ])
  async updateUser(
    @Args('id', { type: () => Int }) id: number,
    @Args('dto', { type: () => UpdateUserInDto }) dto: UpdateUserInDto,
  ) {
    return this.userService.update(id, dto);
  }

  @Mutation(() => Boolean)
  @Access.allow([{ role: UserRole.ADMIN, targetScope: AccessScope.GLOBAL }])
  async deleteUser(@Args('id', { type: () => Int }, UserByIdPipe) user: User) {
    await this.userService.delete(user);

    return true;
  }
}
