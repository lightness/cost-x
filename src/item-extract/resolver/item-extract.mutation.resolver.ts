import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope, PermissionLevel, WorkspaceRole } from '../../access/interfaces';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { ItemByIdPipe } from '../../common/pipe/item-by-id.pipe';
import { DeepArgs } from '../../graphql/decorator/deep-args.decorator';
import Item from '../../item/entity/item.entity';
import { Permission } from '../../access/entity/permission.enum';
import User from '../../user/entity/user.entity';
import { ExtractAsItemInDto } from '../dto';
import { ItemExtractService } from '../item-extract.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(TransactionInterceptor)
export class ItemExtractMutationResolver {
  constructor(private itemExtractService: ItemExtractService) {}

  @Mutation(() => Item)
  @Access.allow([
    { targetId: fromArg('dto.itemId'), targetScope: AccessScope.ITEM, workspaceRole: WorkspaceRole.OWNER },
    { targetId: fromArg('dto.itemId'), targetScope: AccessScope.ITEM, workspaceRole: WorkspaceRole.MEMBER, permission: Permission.ITEM_UPDATE },
    { level: PermissionLevel.ADMIN, permission: Permission.ITEM_UPDATE },
  ])
  async extractAsItem(
    @Args('dto') dto: ExtractAsItemInDto,
    @DeepArgs('dto.itemId', ItemByIdPipe) sourceItem: Item,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.itemExtractService.extractAsItem(
      sourceItem,
      dto.paymentIds,
      dto.title,
      currentUser,
      tx,
    );
  }
}
