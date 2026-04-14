import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { Access2Service } from './access2.service';
import { Access2Guard } from './guard/access2.guard';
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
  exports: [Access2Service, Access2Guard],
  imports: [PrismaModule],
  providers: [
    Access2Service,
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
