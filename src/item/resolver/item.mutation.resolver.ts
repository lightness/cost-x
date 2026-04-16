import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
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
import { WorkspaceByIdPipe } from '../../common/pipe/workspace-by-id.pipe';
import { WorkspaceByItemPipe } from '../../common/pipe/workspace-by-item.pipe';
import { UserRole } from '../../user/entity/user-role.enum';
import User from '../../user/entity/user.entity';
import { ItemInDto } from '../dto';
import Item from '../entity/item.entity';
import { ItemService } from '../item.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(TransactionInterceptor)
export class ItemMutationResolver {
  constructor(private itemService: ItemService) {}

  @Mutation(() => Item)
  @Access.allow({
    or: [
      { target: 'workspace', targetScope: AccessScope.WORKSPACE, workspaceRole: [WorkspaceRole.OWNER, WorkspaceRole.MEMBER] },
      { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    ],
  })
  @Infer('workspace', { from: fromArg('workspaceId'), pipes: [WorkspaceByIdPipe] })
  async createItem(
    @Args('workspaceId', { type: () => Int }) workspaceId: number,
    @Args('dto', { type: () => ItemInDto }) dto: ItemInDto,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.itemService.create(workspaceId, dto, currentUser, tx);
  }

  @Mutation(() => Item)
  @Access.allow({
    or: [
      { target: 'workspace', targetScope: AccessScope.WORKSPACE, workspaceRole: [WorkspaceRole.OWNER, WorkspaceRole.MEMBER] },
      { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    ],
  })
  @Infer('item', { from: fromArg('id'), pipes: [ItemByIdPipe] })
  @Infer('workspace', { from: 'item', pipes: [WorkspaceByItemPipe] })
  async updateItem(
    @Args('id', { type: () => Int }) id: number,
    @Args('dto', { type: () => ItemInDto }) dto: ItemInDto,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.itemService.update(id, dto, currentUser, tx);
  }

  @Mutation(() => Boolean)
  @Access.allow({
    or: [
      { target: 'workspace', targetScope: AccessScope.WORKSPACE, workspaceRole: [WorkspaceRole.OWNER, WorkspaceRole.MEMBER] },
      { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    ],
  })
  @Infer('item', { from: fromArg('id'), pipes: [ItemByIdPipe] })
  @Infer('workspace', { from: 'item', pipes: [WorkspaceByItemPipe] })
  async deleteItem(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    await this.itemService.delete(id, currentUser, tx);

    return true;
  }
}
