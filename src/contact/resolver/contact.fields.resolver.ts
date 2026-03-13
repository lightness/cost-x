import { UseInterceptors } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { GqlLoggingInterceptor } from '../../graphql/interceptor/gql-logging.interceptor';
import { UserByUserIdLoader } from '../../user/dataloader/user-by-user-id.loader';
import { User } from '../../user/entity/user.entity';
import { InviteByInviteIdLoader } from '../dataloader/invite-by-invite-id.loader';
import { Contact } from '../entity/contact.entity';
import { Invite } from '../entity/invite.entity';

@Resolver(() => Contact)
@UseInterceptors(GqlLoggingInterceptor)
export class ContactFieldsResolver {
  constructor(
    private userByUserIdLoader: UserByUserIdLoader,
    private inviteByInviteIdLoader: InviteByInviteIdLoader,
  ) {}

  @ResolveField(() => User)
  async sourceUser(@Parent() contact: Contact): Promise<User> {
    return this.userByUserIdLoader.load(contact.sourceUserId);
  }

  @ResolveField(() => User)
  async targetUser(@Parent() contact: Contact): Promise<User> {
    return this.userByUserIdLoader.load(contact.targetUserId);
  }

  @ResolveField(() => Invite)
  async invite(@Parent() contact: Contact): Promise<Invite> {
    return this.inviteByInviteIdLoader.load(contact.inviteId);
  }
}
