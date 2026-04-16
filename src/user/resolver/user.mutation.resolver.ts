import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope } from '../../access/interfaces';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { Infer } from '../../common/decorator/infer.decorator';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { UserByIdPipe } from '../../common/pipe/user-by-id.pipe';
import { GqlLoggingInterceptor } from '../../graphql/interceptor/gql-logging.interceptor';
import { UpdateUserInDto } from '../dto';
import { UserRole } from '../entity/user-role.enum';
import User from '../entity/user.entity';
import { UserService } from '../user.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(GqlLoggingInterceptor, TransactionInterceptor)
export class UserMutationResolver {
  constructor(private userService: UserService) {}

  @Mutation(() => User)
  @Access.allow({
    or: [
      { role: UserRole.USER, target: 'user', targetScope: AccessScope.USER },
      { role: UserRole.ADMIN, targetScope: AccessScope.USER },
    ],
  })
  @Infer('user', { from: fromArg('id'), pipes: [UserByIdPipe] })
  async updateUser(
    @Args('id', { type: () => Int }) id: number,
    @Args('dto', { type: () => UpdateUserInDto }) dto: UpdateUserInDto,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.userService.update(id, dto, tx);
  }

  @Mutation(() => Boolean)
  @Access.allow({ role: UserRole.ADMIN, targetScope: AccessScope.USER })
  async deleteUser(
    @Args('id', { type: () => Int }, UserByIdPipe) user: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    await this.userService.delete(user, tx);

    return true;
  }

  @Mutation(() => User)
  @Access.allow({ role: [UserRole.ADMIN], targetScope: AccessScope.USER })
  async banUser(
    @Args('id', { type: () => Int }, UserByIdPipe) user: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.userService.ban(user, tx);
  }

  @Mutation(() => User)
  @Access.allow({ role: [UserRole.ADMIN], targetScope: AccessScope.USER })
  async unbanUser(
    @Args('id', { type: () => Int }, UserByIdPipe) user: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.userService.unban(user, tx);
  }
}
