import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope, WorkspaceRole } from '../../access/interfaces';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { Infer } from '../../common/decorator/infer.decorator';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { ItemByIdPipe } from '../../common/pipe/item-by-id.pipe';
import { TagByIdPipe } from '../../common/pipe/tag-by-id.pipe';
import { WorkspaceByItemPipe } from '../../common/pipe/workspace-by-item.pipe';
import { WorkspaceByTagPipe } from '../../common/pipe/workspace-by-tag.pipe';
import { DeepArgs } from '../../graphql/decorator/deep-args.decorator';
import Item from '../../item/entity/item.entity';
import Tag from '../../tag/entity/tag.entity';
import { UserRole } from '../../user/entity/user-role.enum';
import User from '../../user/entity/user.entity';
import { AssignTagInDto, UnassignTagInDto } from '../dto';
import ItemTag from '../entity/item-tag.entity';
import { ItemTagService } from '../item-tag.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(TransactionInterceptor)
export class ItemTagMutationResolver {
  constructor(private itemTagService: ItemTagService) {}

  @Mutation(() => ItemTag)
  @Access.allow({
    or: [
      { role: [UserRole.ADMIN], scope: AccessScope.USER },
      {
        and: [
          {
            target: 'itemWorkspace',
            scope: AccessScope.WORKSPACE,
            workspaceRole: [WorkspaceRole.OWNER, WorkspaceRole.MEMBER],
          },
          {
            target: 'tagWorkspace',
            scope: AccessScope.WORKSPACE,
            workspaceRole: [WorkspaceRole.OWNER, WorkspaceRole.MEMBER],
          },
        ],
      },
    ],
  })
  @Infer('itemWorkspace', {
    from: fromArg('dto.itemId'),
    pipes: [ItemByIdPipe, WorkspaceByItemPipe],
  })
  @Infer('tagWorkspace', { from: fromArg('dto.tagId'), pipes: [TagByIdPipe, WorkspaceByTagPipe] })
  async assignTag(
    @Args('dto') _: AssignTagInDto,
    @DeepArgs('dto.itemId', ItemByIdPipe) item: Item,
    @DeepArgs('dto.tagId', TagByIdPipe) tag: Tag,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.itemTagService.assignTag(item, tag, currentUser, tx);
  }

  @Mutation(() => Boolean)
  @Access.allow({
    or: [
      { role: [UserRole.ADMIN], scope: AccessScope.USER },
      {
        and: [
          {
            target: 'itemWorkspace',
            scope: AccessScope.WORKSPACE,
            workspaceRole: [WorkspaceRole.OWNER, WorkspaceRole.MEMBER],
          },
          {
            target: 'tagWorkspace',
            scope: AccessScope.WORKSPACE,
            workspaceRole: [WorkspaceRole.OWNER, WorkspaceRole.MEMBER],
          },
        ],
      },
    ],
  })
  @Infer('itemWorkspace', {
    from: fromArg('dto.itemId'),
    pipes: [ItemByIdPipe, WorkspaceByItemPipe],
  })
  @Infer('tagWorkspace', { from: fromArg('dto.tagId'), pipes: [TagByIdPipe, WorkspaceByTagPipe] })
  async unassignTag(
    @Args('dto') _: UnassignTagInDto,
    @DeepArgs('dto.itemId', ItemByIdPipe) item: Item,
    @DeepArgs('dto.tagId', TagByIdPipe) tag: Tag,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    await this.itemTagService.unassignTag(item, tag, currentUser, tx);

    return true;
  }
}
