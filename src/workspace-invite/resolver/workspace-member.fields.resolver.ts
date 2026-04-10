import { UseInterceptors } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { GqlLoggingInterceptor } from '../../graphql/interceptor/gql-logging.interceptor';
import { UserByUserIdLoader } from '../../user/dataloader/user-by-user-id.loader';
import User from '../../user/entity/user.entity';
import { WorkspaceMember } from '../entity/workspace-member.entity';

@Resolver(() => WorkspaceMember)
@UseInterceptors(GqlLoggingInterceptor)
export class WorkspaceMemberFieldsResolver {
  constructor(private userByUserIdLoader: UserByUserIdLoader) {}

  @ResolveField(() => User)
  async user(@Parent() member: WorkspaceMember): Promise<User> {
    return this.userByUserIdLoader.load(member.userId);
  }
}
