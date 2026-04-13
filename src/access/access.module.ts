import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AccessService } from './access.service';
import { Access2Guard } from './guard/access2.guard';
import { AccessGuard } from './guard/access.guard';
import { RuleEngineService } from './rule-engine.service';
import {
  FormalAccessStrategy,
  GlobalAccessStrategy,
  UserToContactAccessStrategy,
  UserToInviteAccessStrategy,
  UserToItemAccessStrategy,
  UserToPaymentAccessStrategy,
  UserToTagAccessStrategy,
  UserToWorkspaceAccessStrategy,
} from './strategy';
import { ACCESS_STRATEGIES } from './strategy/interface';

@Module({
  exports: [AccessService, AccessGuard, Access2Guard],
  imports: [PrismaModule],
  providers: [
    AccessService,
    AccessGuard,
    Access2Guard,
    RuleEngineService,
    // access strategies
    FormalAccessStrategy,
    GlobalAccessStrategy,
    UserToContactAccessStrategy,
    UserToInviteAccessStrategy,
    UserToItemAccessStrategy,
    UserToTagAccessStrategy,
    UserToPaymentAccessStrategy,
    UserToWorkspaceAccessStrategy,
    {
      inject: [
        FormalAccessStrategy,
        GlobalAccessStrategy,
        UserToContactAccessStrategy,
        UserToInviteAccessStrategy,
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
