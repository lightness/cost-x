import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/client';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope, WorkspacePermission } from '../../access/interfaces';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { Infer } from '../../common/decorator/infer.decorator';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { WorkspaceByIdPipe } from '../../common/pipe/workspace-by-id.pipe';
import { Currency } from '../../currency-rate/entity/currency.enum';
import { UserRole } from '../../user/entity/user-role.enum';
import User from '../../user/entity/user.entity';
import { Workspace } from '../../workspace/entity/workspace.entity';
import { WorkspaceCurrencyService } from '../workspace-currency.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(TransactionInterceptor)
export class WorkspaceCurrencyMutationResolver {
  constructor(private workspaceCurrencyService: WorkspaceCurrencyService) {}

  @Mutation(() => Workspace)
  @Access.allow({
    or: [
      {
        permission: [WorkspacePermission.UPDATE_WORKSPACE_DEFAULT_CURRENCY],
        scope: AccessScope.WORKSPACE,
        target: 'workspace',
      },
      { owner: 'workspace', scope: AccessScope.WORKSPACE },
      { role: [UserRole.ADMIN], scope: AccessScope.USER },
    ],
  })
  @Infer('workspace', { from: fromArg('workspaceId'), pipes: [WorkspaceByIdPipe] })
  async updateWorkspaceDefaultCurrency(
    @Args('workspaceId', { type: () => Int }, WorkspaceByIdPipe) workspace: Workspace,
    @Args('defaultCurrency', { type: () => Currency }) defaultCurrency: Currency,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.workspaceCurrencyService.updateDefaultCurrency(
      workspace,
      defaultCurrency,
      currentUser,
      tx,
    );
  }
}
