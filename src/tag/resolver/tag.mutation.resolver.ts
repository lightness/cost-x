import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope } from '../../access/interfaces';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { GqlLoggingInterceptor } from '../../graphql/interceptor/gql-logging.interceptor';
import { UserRole } from '../../user/entity/user-role.enum';
import User from '../../user/entity/user.entity';
import { TagInDto } from '../dto';
import Tag from '../entity/tag.entity';
import { TagService } from '../tag.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(GqlLoggingInterceptor, TransactionInterceptor)
export class TagMutationResolver {
  constructor(private tagService: TagService) {}

  @Mutation(() => Tag)
  @Access.allow([
    {
      role: [UserRole.USER],
      targetId: fromArg('workspaceId'),
      targetScope: AccessScope.WORKSPACE,
    },
    { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
  ])
  async createTag(
    @Args('workspaceId', { type: () => Int }) workspaceId: number,
    @Args('dto', { type: () => TagInDto }) dto: TagInDto,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.tagService.create(workspaceId, dto, currentUser, tx);
  }

  @Mutation(() => Tag)
  @Access.allow([
    {
      role: [UserRole.USER],
      targetId: fromArg('id'),
      targetScope: AccessScope.TAG,
    },
    { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
  ])
  async updateTag(
    @Args('id', { type: () => Int }) id: number,
    @Args('dto', { type: () => TagInDto }) dto: TagInDto,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.tagService.update(id, dto, currentUser, tx);
  }

  @Mutation(() => Boolean)
  @Access.allow([
    {
      role: [UserRole.USER],
      targetId: fromArg('id'),
      targetScope: AccessScope.TAG,
    },
    { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
  ])
  async deleteTag(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    await this.tagService.delete(id, currentUser, tx);

    return true;
  }
}
