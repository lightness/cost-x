import { UseInterceptors } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { GqlLoggingInterceptor } from '../../graphql/interceptor/gql-logging.interceptor';
import { UserByUserIdLoader } from '../../user/dataloader/user-by-user-id.loader';
import User from '../../user/entity/user.entity';
import { UserBlock } from '../entity/user-block.entity';

@Resolver(() => UserBlock)
@UseInterceptors(GqlLoggingInterceptor)
export class UserBlockFieldsResolver {
  constructor(private userByUserIdLoader: UserByUserIdLoader) {}

  @ResolveField(() => User)
  async blocker(@Parent() userBlock: UserBlock): Promise<User> {
    return this.userByUserIdLoader.load(userBlock.blockerId);
  }

  @ResolveField(() => User)
  async blocked(@Parent() userBlock: UserBlock): Promise<User> {
    return this.userByUserIdLoader.load(userBlock.blockedId);
  }
}
