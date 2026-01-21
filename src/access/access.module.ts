import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AccessService } from './access.service';
import { AccessGuard } from './guard/access.guard';
import { RuleEngineService } from './rule-engine.service';
import {
  FormalAccessStrategy,
  GlobalAccessStrategy,
  UserToItemAccessStrategy,
  UserToTagAccessStrategy,
  UserToWorkspaceAccessStrategy,
} from './strategy';
import { ACCESS_STRATEGIES } from './strategy/interface';

@Module({
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
    UserToWorkspaceAccessStrategy,
    {
      provide: ACCESS_STRATEGIES,
      useFactory: (...strategies) => strategies,
      inject: [
        FormalAccessStrategy,
        GlobalAccessStrategy,
        UserToItemAccessStrategy,
        UserToTagAccessStrategy,
        UserToWorkspaceAccessStrategy,
      ],
    },
  ],
  exports: [AccessService, AccessGuard],
})
export class AccessModule {}
