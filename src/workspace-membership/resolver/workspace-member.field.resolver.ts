import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { UserByUserIdLoader } from '../../user/dataloader/user-by-user-id.loader';
import User from '../../user/entity/user.entity';
import { WorkspaceInviteByInviteIdLoader } from '../dataloader/workspace-invite-by-invite-id.loader';
import { WorkspaceInvite } from '../entity/workspace-invite.entity';
import { WorkspaceMember } from '../entity/workspace-member.entity';

@Resolver(() => WorkspaceMember)
export class WorkspaceMemberFieldResolver {
  constructor(
    private userByUserIdLoader: UserByUserIdLoader,
    private workspaceInviteByInviteIdLoader: WorkspaceInviteByInviteIdLoader,
  ) {}

  @ResolveField(() => User)
  async user(@Parent() member: WorkspaceMember): Promise<User> {
    return this.userByUserIdLoader.load(member.userId);
  }

  @ResolveField(() => WorkspaceInvite)
  async invite(@Parent() member: WorkspaceMember): Promise<WorkspaceInvite> {
    return this.workspaceInviteByInviteIdLoader.load(member.inviteId);
  }

  @ResolveField(() => User, { nullable: true })
  async removedByUser(@Parent() member: WorkspaceMember): Promise<User | null> {
    if (!member.removedByUserId) {
      return null;
    }

    return this.userByUserIdLoader.load(member.removedByUserId);
  }
}
