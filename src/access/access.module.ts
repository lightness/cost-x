import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AccessService } from './access.service';
import { AccessGuard } from './guard/access.guard';
import { FormalAccessStrategy, GlobalAccessStrategy, UserToWorkspaceAccessStrategy } from './strategy';
import { ACCESS_STRATEGIES } from './strategy/interface';
import { RuleEngineService } from './rule-engine.service';

@Module({
  imports: [PrismaModule],
  providers: [
    AccessService, 
    AccessGuard,
    RuleEngineService,
    // access strategies
    FormalAccessStrategy,
    GlobalAccessStrategy,
    UserToWorkspaceAccessStrategy,
    {
      provide: ACCESS_STRATEGIES,
      useFactory: (...strategies) => strategies,
      inject: [
        FormalAccessStrategy,
        GlobalAccessStrategy,
        UserToWorkspaceAccessStrategy,
      ]
    }
  ],
  exports: [AccessService, AccessGuard],
})
export class AccessModule { }
