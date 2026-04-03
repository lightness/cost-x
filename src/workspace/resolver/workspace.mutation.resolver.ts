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
import { UserRole } from '../../user/entity/user-role.enum';
import { User } from '../../user/entity/user.entity';
import { WorkspaceInDto } from '../dto';
import { Workspace } from '../entity/workspace.entity';
import { WorkspaceService } from '../workspace.service';

@Resolver()
@UseGuards(AuthGuard, AccessGuard)
@UseInterceptors(TransactionInterceptor)
export class WorkspaceMutationResolver {
  constructor(private workspaceService: WorkspaceService) {}

  @Mutation(() => Workspace)
  @Access.allow([{ role: [UserRole.USER, UserRole.ADMIN], targetScope: AccessScope.GLOBAL }])
  async createWorkspace(
    @Args('dto') dto: WorkspaceInDto,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.workspaceService.create(dto, currentUser, tx);
  }

  @Mutation(() => Workspace)
  @Access.allow([
    {
      role: [UserRole.USER],
      targetId: fromArg('id'),
      targetScope: AccessScope.WORKSPACE,
    },
    { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
  ])
  async updateWorkspace(
    @Args('id', { type: () => Int }) id: number,
    @Args('dto') dto: WorkspaceInDto,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.workspaceService.update(id, dto, tx);
  }

  @Mutation(() => Workspace)
  @Access.allow([
    {
      role: [UserRole.USER],
      targetId: fromArg('id'),
      targetScope: AccessScope.WORKSPACE,
    },
    { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
  ])
  async deleteWorkspace(
    @Args('id', { type: () => Int }) id: number,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.workspaceService.delete(id, tx);
  }
}
