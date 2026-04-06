import { UseInterceptors } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { GqlLoggingInterceptor } from '../../graphql/interceptor/gql-logging.interceptor';
import { UserByUserIdLoader } from '../../user/dataloader/user-by-user-id.loader';
import User from '../../user/entity/user.entity';
import { Invite } from '../entity/invite.entity';

@Resolver(() => Invite)
@UseInterceptors(GqlLoggingInterceptor)
export class InviteFieldsResolver {
  constructor(private userByUserIdLoader: UserByUserIdLoader) {}

  @ResolveField(() => User)
  async inviter(@Parent() invite: Invite): Promise<User> {
    return this.userByUserIdLoader.load(invite.inviterId);
  }

  @ResolveField(() => User)
  async invitee(@Parent() invite: Invite): Promise<User> {
    return this.userByUserIdLoader.load(invite.inviteeId);
  }
}
