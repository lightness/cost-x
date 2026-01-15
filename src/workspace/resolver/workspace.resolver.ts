import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Workspace } from '../entity/workspace.entity';
import { Access } from '../../access/decorator/access.decorator';
import { AccessScope } from '../../access/interfaces';
import { UserRole } from '../../user/entities/user-role.enum';
import { WorkspaceInDto } from '../dto';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { User } from '../../user/entities/user.entity';
import { WorkspaceService } from '../workspace.service';
import { fromArg } from '../../access/function/from-arg.function';

@Resolver(() => Workspace)
export class WorkspaceResolver {
  constructor(private workspaceService: WorkspaceService) {}

  @Query(() => [Workspace])
  @Access.allow([
    { targetScope: AccessScope.GLOBAL, role: [UserRole.USER, UserRole.ADMIN] },
  ])
  async my(@CurrentUser() currentUser: User): Promise<Workspace[]> {
    return this.workspaceService.listByOwnerId(currentUser.id);
  }

  @Mutation(() => Workspace)
  @Access.allow([
    { targetScope: AccessScope.GLOBAL, role: [UserRole.USER, UserRole.ADMIN] },
  ])
  async createWorkspace(
    @Args('dto') dto: WorkspaceInDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.workspaceService.create(dto, currentUser);
  }

  @Mutation(() => Workspace)
  @Access.allow([
    {
      targetScope: AccessScope.WORKSPACE,
      targetId: fromArg('id'),
      role: [UserRole.USER],
    },
    { targetScope: AccessScope.GLOBAL, role: [UserRole.ADMIN] },
  ])
  async updateWorkspace(
    @Args('id', { type: () => Int }) id: number,
    @Args('dto') dto: WorkspaceInDto,
  ) {
    return this.workspaceService.update(id, dto);
  }

  @Mutation(() => Workspace)
  @Access.allow([
    {
      targetScope: AccessScope.WORKSPACE,
      targetId: fromArg('id'),
      role: [UserRole.USER],
    },
    { targetScope: AccessScope.GLOBAL, role: [UserRole.ADMIN] },
  ])
  async deleteWorkspace(@Args('id', { type: () => Int }) id: number) {
    return this.workspaceService.delete(id);
  }
}
