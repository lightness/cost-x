import { UseInterceptors } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { GqlLoggingInterceptor } from '../../graphql/interceptor/gql-logging.interceptor';
import { UserByUserIdLoader } from '../../user/dataloader/user-by-user-id.loader';
import User from '../../user/entity/user.entity';
import { WorkspaceInvite } from '../entity/workspace-invite.entity';

@Resolver(() => WorkspaceInvite)
@UseInterceptors(GqlLoggingInterceptor)
export class WorkspaceInviteFieldsResolver {
  constructor(private userByUserIdLoader: UserByUserIdLoader) {}

  @ResolveField(() => User)
  async inviter(@Parent() invite: WorkspaceInvite): Promise<User> {
    return this.userByUserIdLoader.load(invite.inviterId);
  }

  @ResolveField(() => User)
  async invitee(@Parent() invite: WorkspaceInvite): Promise<User> {
    return this.userByUserIdLoader.load(invite.inviteeId);
  }
}
