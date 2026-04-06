import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class StubQueryResolver {
  @Query(() => Boolean)
  _stub() {
    return true;
  }
}
