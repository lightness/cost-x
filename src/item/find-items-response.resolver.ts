import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { FindItemsAggregates, FindItemsResponse } from './dto';

@Resolver(() => FindItemsResponse)
export class FindItemsResponseResolver {
  @ResolveField(() => FindItemsAggregates)
  async aggregates(
    @Parent() parent: FindItemsResponse,
  ): Promise<{}> {
    return { items: parent.data };
  }
}