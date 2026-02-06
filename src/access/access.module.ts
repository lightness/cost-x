import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AccessService } from './access.service';
import { AccessGuard } from './guard/access.guard';
import { RuleEngineService } from './rule-engine.service';
import {
  FormalAccessStrategy,
  GlobalAccessStrategy,
  UserToItemAccessStrategy,
  UserToPaymentAccessStrategy,
  UserToTagAccessStrategy,
  UserToWorkspaceAccessStrategy,
} from './strategy';
import { ACCESS_STRATEGIES } from './strategy/interface';

@Module({
  exports: [AccessService, AccessGuard],
  imports: [PrismaModule],
  providers: [
    AccessService,
    AccessGuard,
    RuleEngineService,
    // access strategies
    FormalAccessStrategy,
    GlobalAccessStrategy,
    UserToItemAccessStrategy,
    UserToTagAccessStrategy,
    UserToPaymentAccessStrategy,
    UserToWorkspaceAccessStrategy,
    {
      inject: [
        FormalAccessStrategy,
        GlobalAccessStrategy,
        UserToItemAccessStrategy,
        UserToTagAccessStrategy,
        UserToPaymentAccessStrategy,
        UserToWorkspaceAccessStrategy,
      ],
      provide: ACCESS_STRATEGIES,
      useFactory: (...strategies) => strategies,
    },
  ],
})
export class AccessModule {}
