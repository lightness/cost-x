import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ContactsByUserIdLoader } from '../../contact/dataloader/contact-by-user-id.loader';
import { IncomingInvitesByUserIdLoader } from '../../contact/dataloader/incoming-invites-by-user-id.loader';
import { OutgoingInvitesByUserIdLoader } from '../../contact/dataloader/outgoing-invites-by-user-id.loader';
import { InvitesFilter } from '../../contact/dto/invite-filter.type';
import { Contact } from '../../contact/entity/contact.entity';
import { InviteStatus } from '../../contact/entity/invite-status.enum';
import { Invite } from '../../contact/entity/invite.entity';
import { WorkspacesByUserIdLoader } from '../../workspace/dataloader/workspaces-by-user-id.loader';
import { WorkspacesFilter } from '../../workspace/dto';
import { Workspace } from '../../workspace/entity/workspace.entity';
import { User } from '../entity/user.entity';

@Resolver(() => User)
export class UserFieldResolver {
  constructor(
    private workspacesByUserIdLoader: WorkspacesByUserIdLoader,
    private incomingInvitesByUserIdLoader: IncomingInvitesByUserIdLoader,
    private outgoingInvitesByUserIdLoader: OutgoingInvitesByUserIdLoader,
    private contactsByUserIdLoader: ContactsByUserIdLoader,
  ) {}

  @ResolveField(() => [Workspace])
  async workspaces(
    @Parent() user: User,
    @Args('workspacesFilter', { nullable: true }) filters: WorkspacesFilter,
  ) {
    const userWorkspaces = this.workspacesByUserIdLoader.withOptions(filters).load(user.id);

    return userWorkspaces;
  }

  @ResolveField(() => [Invite])
  async incomingInvites(
    @Parent() user: User,
    @Args('invitesFilter', { nullable: true }) filters: InvitesFilter,
  ) {
    const incomingInvites = this.incomingInvitesByUserIdLoader
      .withOptions({ status: filters?.status || InviteStatus.PENDING })
      .load(user.id);

    return incomingInvites;
  }

  @ResolveField(() => [Invite])
  async outgoingInvites(
    @Parent() user: User,
    @Args('invitesFilter', { nullable: true }) filters: InvitesFilter,
  ) {
    const outgoingInvites = this.outgoingInvitesByUserIdLoader
      .withOptions({ status: filters?.status || InviteStatus.PENDING })
      .load(user.id);

    return outgoingInvites;
  }

  @ResolveField(() => [Contact])
  async contacts(@Parent() user: User) {
    const contacts = this.contactsByUserIdLoader.load(user.id);

    return contacts;
  }
}
