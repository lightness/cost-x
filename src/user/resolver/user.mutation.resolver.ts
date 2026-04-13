import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access2 } from '../../access/decorator/access2.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { Access2Guard } from '../../access/guard/access2.guard';
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
@UseGuards(AuthGuard, Access2Guard)
@UseInterceptors(GqlLoggingInterceptor, TransactionInterceptor)
export class UserMutationResolver {
  constructor(private userService: UserService) {}

  @Mutation(() => User)
  @Access2.allow({
    or: [
      { role: UserRole.USER, target: 'user', targetScope: AccessScope.USER },
      { role: UserRole.ADMIN, targetScope: AccessScope.GLOBAL },
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
  @Access2.allow({ role: UserRole.ADMIN, targetScope: AccessScope.GLOBAL })
  async deleteUser(
    @Args('id', { type: () => Int }, UserByIdPipe) user: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    await this.userService.delete(user, tx);

    return true;
  }

  @Mutation(() => User)
  @Access2.allow({ role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL })
  async banUser(
    @Args('id', { type: () => Int }, UserByIdPipe) user: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.userService.ban(user, tx);
  }

  @Mutation(() => User)
  @Access2.allow({ role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL })
  async unbanUser(
    @Args('id', { type: () => Int }, UserByIdPipe) user: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.userService.unban(user, tx);
  }
}
