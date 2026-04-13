import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access2 } from '../../access/decorator/access2.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { Access2Guard } from '../../access/guard/access2.guard';
import { AccessScope } from '../../access/interfaces';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { Infer } from '../../common/decorator/infer.decorator';
import { TagByIdPipe } from '../../common/pipe/tag-by-id.pipe';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { WorkspaceByIdPipe } from '../../common/pipe/workspace-by-id.pipe';
import { WorkspaceByTagPipe } from '../../common/pipe/workspace-by-tag.pipe';
import { GqlLoggingInterceptor } from '../../graphql/interceptor/gql-logging.interceptor';
import { UserRole } from '../../user/entity/user-role.enum';
import User from '../../user/entity/user.entity';
import { TagInDto } from '../dto';
import Tag from '../entity/tag.entity';
import { TagService } from '../tag.service';

@Resolver()
@UseGuards(AuthGuard, Access2Guard)
@UseInterceptors(GqlLoggingInterceptor, TransactionInterceptor)
export class TagMutationResolver {
  constructor(private tagService: TagService) {}

  @Mutation(() => Tag)
  @Access2.allow({
    or: [
      { role: [UserRole.USER], target: 'workspace', targetScope: AccessScope.WORKSPACE },
      { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    ],
  })
  @Infer('workspace', { from: fromArg('workspaceId'), pipes: [WorkspaceByIdPipe] })
  async createTag(
    @Args('workspaceId', { type: () => Int }) workspaceId: number,
    @Args('dto', { type: () => TagInDto }) dto: TagInDto,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.tagService.create(workspaceId, dto, currentUser, tx);
  }

  @Mutation(() => Tag)
  @Access2.allow({
    or: [
      { role: [UserRole.USER], target: 'workspace', targetScope: AccessScope.WORKSPACE },
      { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    ],
  })
  @Infer('tag', { from: fromArg('id'), pipes: [TagByIdPipe] })
  @Infer('workspace', { from: 'tag', pipes: [WorkspaceByTagPipe] })
  async updateTag(
    @Args('id', { type: () => Int }) id: number,
    @Args('dto', { type: () => TagInDto }) dto: TagInDto,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.tagService.update(id, dto, currentUser, tx);
  }

  @Mutation(() => Boolean)
  @Access2.allow({
    or: [
      { role: [UserRole.USER], target: 'workspace', targetScope: AccessScope.WORKSPACE },
      { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    ],
  })
  @Infer('tag', { from: fromArg('id'), pipes: [TagByIdPipe] })
  @Infer('workspace', { from: 'tag', pipes: [WorkspaceByTagPipe] })
  async deleteTag(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    await this.tagService.delete(id, currentUser, tx);

    return true;
  }
}
