import { Module } from '@nestjs/common';
import { StubQueryResolver } from './stub.query.resolver';

@Module({
  exports: [StubQueryResolver],
  providers: [StubQueryResolver],
})
export class TestGraphqlModule {}
