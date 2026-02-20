import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope } from '../../access/interfaces';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { UserByIdPipe } from '../../common/pipe/user-by-id.pipe';
import { GqlLoggingInterceptor } from '../../graphql/interceptor/gql-logging.interceptor';
import { CreateUserInDto, UpdateUserInDto } from '../dto';
import { UserRole } from '../entity/user-role.enum';
import { User } from '../entity/user.entity';
import { UserService } from '../user.service';

@Resolver()
@UseInterceptors(GqlLoggingInterceptor)
export class UserMutationResolver {
  constructor(private userService: UserService) {}

  @Mutation(() => User)
  async createUser(
    @Args('dto', { type: () => CreateUserInDto }) dto: CreateUserInDto,
  ) {
    return this.userService.create(dto);
  }

  @Mutation(() => User)
  @UseGuards(AuthGuard, AccessGuard)
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
  @UseGuards(AuthGuard, AccessGuard)
  @Access.allow([{ role: UserRole.ADMIN, targetScope: AccessScope.GLOBAL }])
  async deleteUser(@Args('id', { type: () => Int }, UserByIdPipe) user: User) {
    await this.userService.delete(user);

    return true;
  }

  @Mutation(() => User)
  @UseGuards(AuthGuard, AccessGuard)
  @Access.allow([{ role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL }])
  async banUser(@Args('id', { type: () => Int }, UserByIdPipe) user: User) {
    return this.userService.ban(user);
  }

  @Mutation(() => User)
  @UseGuards(AuthGuard, AccessGuard)
  @Access.allow([{ role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL }])
  async unbanUser(@Args('id', { type: () => Int }, UserByIdPipe) user: User) {
    return this.userService.unban(user);
  }
}
