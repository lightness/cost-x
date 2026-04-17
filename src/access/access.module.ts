import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AccessService } from './access.service';
import { AccessGuard } from './guard/access.guard';
import { UserPermissionQueryResolver } from './resolver/user-permission.query.resolver';
import { RuleEngineService } from './rule-engine.service';
import { UserAccessStrategy, UserPermissionAccessStrategy, UserToWorkspaceAccessStrategy } from './strategy';
import { ACCESS_STRATEGIES } from './strategy/interface';
import { UserPermissionService } from './user-permission.service';

@Module({
  exports: [AccessService, AccessGuard, UserPermissionService],
  imports: [AuthModule, PrismaModule],
  providers: [
    AccessService,
    AccessGuard,
    RuleEngineService,
    UserPermissionService,
    UserPermissionQueryResolver,
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
