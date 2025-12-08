import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { FindPaymentsAggregates, FindPaymentsResponse } from './dto';

@Resolver(() => FindPaymentsResponse)
export class FindPaymentsResponseResolver {
  @ResolveField(() => FindPaymentsAggregates)
  async aggregates(
    @Parent() parent: FindPaymentsResponse,
  ) {
    return { payments: parent.data };
  }
}