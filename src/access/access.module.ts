import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AccessService } from './access.service';
import { AccessGuard } from './guard/access.guard';
import { RuleEngineService } from './rule-engine.service';
import { UserAccessStrategy, UserPermissionAccessStrategy, UserToWorkspaceAccessStrategy } from './strategy';
import { ACCESS_STRATEGIES } from './strategy/interface';

@Module({
  exports: [AccessService, AccessGuard],
  imports: [PrismaModule],
  providers: [
    AccessService,
    AccessGuard,
    RuleEngineService,
    // access strategies
    UserAccessStrategy,
    UserPermissionAccessStrategy,
    UserToWorkspaceAccessStrategy,
    {
      inject: [UserAccessStrategy, UserPermissionAccessStrategy, UserToWorkspaceAccessStrategy],
      provide: ACCESS_STRATEGIES,
      useFactory: (...strategies) => strategies,
    },
  ],
})
export class AccessModule {}
