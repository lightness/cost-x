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
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { WorkspaceByIdPipe } from '../../common/pipe/workspace-by-id.pipe';
import { UserRole } from '../../user/entity/user-role.enum';
import User from '../../user/entity/user.entity';
import { WorkspaceInDto } from '../dto';
import { Workspace } from '../entity/workspace.entity';
import { WorkspaceService } from '../workspace.service';

@Resolver()
@UseGuards(AuthGuard, Access2Guard)
@UseInterceptors(TransactionInterceptor)
export class WorkspaceMutationResolver {
  constructor(private workspaceService: WorkspaceService) {}

  @Mutation(() => Workspace)
  @Access2.allow({ role: [UserRole.USER, UserRole.ADMIN], targetScope: AccessScope.GLOBAL })
  async createWorkspace(
    @Args('dto') dto: WorkspaceInDto,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.workspaceService.create(dto, currentUser, tx);
  }

  @Mutation(() => Workspace)
  @Access2.allow({
    or: [
      { role: [UserRole.USER], target: 'workspace', targetScope: AccessScope.WORKSPACE },
      { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    ],
  })
  @Infer('workspace', { from: fromArg('id'), pipes: [WorkspaceByIdPipe] })
  async updateWorkspace(
    @Args('id', { type: () => Int }) id: number,
    @Args('dto') dto: WorkspaceInDto,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.workspaceService.update(id, dto, currentUser, tx);
  }

  @Mutation(() => Workspace)
  @Access2.allow({
    or: [
      { role: [UserRole.USER], target: 'workspace', targetScope: AccessScope.WORKSPACE },
      { role: [UserRole.ADMIN], targetScope: AccessScope.GLOBAL },
    ],
  })
  @Infer('workspace', { from: fromArg('id'), pipes: [WorkspaceByIdPipe] })
  async deleteWorkspace(
    @Args('id', { type: () => Int }) id: number,
    @CurrentUser() currentUser: User,
    @Context('tx') tx: Prisma.TransactionClient,
  ) {
    return this.workspaceService.delete(id, currentUser, tx);
  }
}
