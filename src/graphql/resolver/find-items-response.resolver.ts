import { Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { FindItemsAggregates, FindItemsResponse } from '../args/find-items-response.type';

@Resolver(() => FindItemsResponse)
export class FindItemsResponseResolver {

  @ResolveField(() => FindItemsAggregates)
  async aggregates(
    @Parent() findItemsResponse: FindItemsResponse,
    @Context() context,
  ): Promise<{}> {
    context.data = findItemsResponse.data;

    return {};
  }
}