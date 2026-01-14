import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope } from '../../access/interfaces';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { CreateUserInDto, UpdateUserInDto } from '../dto';
import { UserRole } from '../entities/user-role.enum';
import { User } from '../entities/user.entity';
import { UserService } from '../user.service';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';

@Resolver(() => User)
@UseGuards(AuthGuard, AccessGuard)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Query(() => [User])
  @Access.allow([
    { targetScope: AccessScope.GLOBAL, role: UserRole.ADMIN }
  ])
  async users() {
    return this.userService.list();
  }

  @Query(() => User)
  @Access.allow([
    { targetScope: AccessScope.USER, targetId: fromArg('id'), role: UserRole.USER },
    { targetScope: AccessScope.GLOBAL, role: UserRole.ADMIN },
  ])
  async user(@Args('id', { type: () => Int }) id: number) {
    return this.userService.getById(id);
  }

  @Query(() => User)
  async me(@CurrentUser() currentUser: User) {
    return currentUser;
  }

  @Mutation(() => User)
  async createUser(@Args('dto', { type: () => CreateUserInDto }) dto: CreateUserInDto) {
    return this.userService.create(dto);
  }

  @Mutation(() => User)
  @Access.allow([
    { targetScope: AccessScope.USER, targetId: fromArg('id'), role: UserRole.USER },
    { targetScope: AccessScope.GLOBAL, role: UserRole.ADMIN },
  ])
  async updateUser(
    @Args('id', { type: () => Int }) id: number,
    @Args('dto', { type: () => UpdateUserInDto }) dto: UpdateUserInDto,
  ) {
    return this.userService.update(id, dto);
  }
}