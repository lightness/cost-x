import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope, PermissionLevel } from '../../access/interfaces';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { UserByIdPipe } from '../../common/pipe/user-by-id.pipe';
import { GqlLoggingInterceptor } from '../../graphql/interceptor/gql-logging.interceptor';
import { Permission } from '../../access/interfaces';
import { CreateUserInDto, UpdateUserInDto } from '../dto';
import User from '../entity/user.entity';
import { UserService } from '../user.service';

@Resolver()
@UseInterceptors(GqlLoggingInterceptor, TransactionInterceptor)
export class UserMutationResolver {
  constructor(private userService: UserService) {}

  @Mutation(() => User)
  async createUser(
    @Args('dto', { type: () => CreateUserInDto }) dto: CreateUserInDto,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.userService.create(dto, tx);
  }

  @Mutation(() => User)
  @UseGuards(AuthGuard, AccessGuard)
  @Access.allow([
    {
      and: [
        { targetId: fromArg('id'), targetScope: AccessScope.USER },
        { level: PermissionLevel.OWNER, permission: Permission.USER_UPDATE },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.USER_UPDATE },
  ])
  async updateUser(
    @Args('id', { type: () => Int }) id: number,
    @Args('dto', { type: () => UpdateUserInDto }) dto: UpdateUserInDto,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.userService.update(id, dto, tx);
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard, AccessGuard)
  @Access.allow([{ level: PermissionLevel.ADMIN, permission: Permission.USER_DELETE }])
  async deleteUser(
    @Args('id', { type: () => Int }, UserByIdPipe) user: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    await this.userService.delete(user, tx);

    return true;
  }

  @Mutation(() => User)
  @UseGuards(AuthGuard, AccessGuard)
  @Access.allow([{ level: PermissionLevel.ADMIN, permission: Permission.USER_BAN }])
  async banUser(
    @Args('id', { type: () => Int }, UserByIdPipe) user: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.userService.ban(user, tx);
  }

  @Mutation(() => User)
  @UseGuards(AuthGuard, AccessGuard)
  @Access.allow([{ level: PermissionLevel.ADMIN, permission: Permission.USER_UNBAN }])
  async unbanUser(
    @Args('id', { type: () => Int }, UserByIdPipe) user: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.userService.unban(user, tx);
  }
}
