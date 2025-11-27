import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { FindItemsResponse, FindItemsAggregates } from '../types';

@Resolver(() => FindItemsResponse)
export class FindItemsResponseResolver {
  @ResolveField(() => FindItemsAggregates)
  async aggregates(
    @Parent() parent: FindItemsResponse,
  ): Promise<{}> {
    return { items: parent.data };
  }
}