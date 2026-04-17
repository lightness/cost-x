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
import { WorkspaceByItemPipe } from '../../common/pipe/workspace-by-item.pipe';
import { DeepArgs } from '../../graphql/decorator/deep-args.decorator';
import Item from '../../item/entity/item.entity';
import { UserRole } from '../../user/entity/user-role.enum';
import User from '../../user/entity/user.entity';
import { ExtractAsItemInDto } from '../dto';
import { ItemExtractService } from '../item-extract.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(TransactionInterceptor)
export class ItemExtractMutationResolver {
  constructor(private itemExtractService: ItemExtractService) {}

  @Mutation(() => Item)
  @Access.allow({
    or: [
      { role: [UserRole.ADMIN], scope: AccessScope.USER },
      {
        target: 'itemWorkspace',
        scope: AccessScope.WORKSPACE,
        workspaceRole: [WorkspaceRole.OWNER, WorkspaceRole.MEMBER],
      },
    ],
  })
  @Infer('itemWorkspace', {
    from: fromArg('dto.itemId'),
    pipes: [ItemByIdPipe, WorkspaceByItemPipe],
  })
  async extractAsItem(
    @Args('dto') dto: ExtractAsItemInDto,
    @DeepArgs('dto.itemId', ItemByIdPipe) sourceItem: Item,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.itemExtractService.extractAsItem(sourceItem, dto.paymentIds, dto.title, currentUser, tx);
  }
}
