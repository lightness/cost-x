import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { BlockedUsersByUserIdLoader } from '../../contact/dataloader/blocked-users-by-user-id.loader';
import { ContactsByUserIdLoader } from '../../contact/dataloader/contacts-by-user-id.loader';
import { IncomingInvitesByUserIdLoader } from '../../contact/dataloader/incoming-invites-by-user-id.loader';
import { OutgoingInvitesByUserIdLoader } from '../../contact/dataloader/outgoing-invites-by-user-id.loader';
import { InvitesFilter } from '../../contact/dto/invite-filter.type';
import { Contact } from '../../contact/entity/contact.entity';
import { InviteStatus } from '../../contact/entity/invite-status.enum';
import { Invite } from '../../contact/entity/invite.entity';
import { JsonScalar } from '../../graphql/scalar';
import { SharedWorkspacesByUserIdLoader } from '../../workspace/dataloader/shared-workspaces-by-user-id.loader';
import { WorkspacesByUserIdLoader } from '../../workspace/dataloader/workspaces-by-user-id.loader';
import { WorkspacesFilter } from '../../workspace/dto';
import { Workspace } from '../../workspace/entity/workspace.entity';
import {
  WorkspaceInvitesByInviteeIdLoader,
} from '../../workspace-invite/dataloader/workspace-invites-by-invitee-id.loader';
import { WorkspaceInviteStatus } from '../../workspace-invite/entity/workspace-invite-status.enum';
import { WorkspaceInvite } from '../../workspace-invite/entity/workspace-invite.entity';
import { PermissionsByUserIdLoader } from '../dataloader/permissions-by-user-id.loader';
import User from '../entity/user.entity';

@Resolver(() => User)
export class UserFieldResolver {
  constructor(
    private permissionsByUserIdLoader: PermissionsByUserIdLoader,
    private workspacesByUserIdLoader: WorkspacesByUserIdLoader,
    private sharedWorkspacesByUserIdLoader: SharedWorkspacesByUserIdLoader,
    private workspaceInvitesByInviteeIdLoader: WorkspaceInvitesByInviteeIdLoader,
    private incomingInvitesByUserIdLoader: IncomingInvitesByUserIdLoader,
    private outgoingInvitesByUserIdLoader: OutgoingInvitesByUserIdLoader,
    private contactsByUserIdLoader: ContactsByUserIdLoader,
    private blockedUsersByUserIdLoader: BlockedUsersByUserIdLoader,
  ) {}

  @ResolveField(() => [Workspace])
  async workspaces(
    @Parent() user: User,
    @Args('workspacesFilter', { nullable: true }) filters: WorkspacesFilter,
  ) {
    const userWorkspaces = await this.workspacesByUserIdLoader.withOptions(filters).load(user.id);

    return userWorkspaces;
  }

  @ResolveField(() => [Invite])
  async incomingInvites(
    @Parent() user: User,
    @Args('invitesFilter', { nullable: true }) filters: InvitesFilter,
  ) {
    const incomingInvites = await this.incomingInvitesByUserIdLoader
      .withOptions({ status: filters?.status || InviteStatus.PENDING })
      .load(user.id);

    return incomingInvites;
  }

  @ResolveField(() => [Invite])
  async outgoingInvites(
    @Parent() user: User,
    @Args('invitesFilter', { nullable: true }) filters: InvitesFilter,
  ) {
    const outgoingInvites = await this.outgoingInvitesByUserIdLoader
      .withOptions({ status: filters?.status || InviteStatus.PENDING })
      .load(user.id);

    return outgoingInvites;
  }

  @ResolveField(() => Boolean)
  isEmailVerified(@Parent() user: User): boolean {
    return user.confirmEmailTempCode === null;
  }

  @ResolveField(() => JsonScalar)
  async permissions(@Parent() user: User): Promise<Record<string, number>> {
    return this.permissionsByUserIdLoader.load(user.id);
  }

  @ResolveField(() => [Workspace])
  async sharedWorkspaces(@Parent() user: User) {
    return this.sharedWorkspacesByUserIdLoader.load(user.id);
  }

  @ResolveField(() => [WorkspaceInvite])
  async pendingWorkspaceInvites(@Parent() user: User) {
    return this.workspaceInvitesByInviteeIdLoader
      .withOptions({ status: WorkspaceInviteStatus.PENDING })
      .load(user.id);
  }

  @ResolveField(() => [Contact])
  async contacts(@Parent() user: User) {
    const contacts = await this.contactsByUserIdLoader.load(user.id);

    return contacts;
  }

  @Resolver(() => [User])
  async blockedUsers(@Parent() user: User) {
    const blockedUsers = await this.blockedUsersByUserIdLoader.load(user.id);

    return blockedUsers;
  }
}
