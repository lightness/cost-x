import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GroupModule } from '../group/group.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AccessService } from './access.service';
import { AccessGuard } from './guard/access.guard';
import { UserPermissionsByUserIdLoader } from './dataloader/user-permissions-by-user-id.loader';
import { UserPermissionQueryResolver } from './resolver/user-permission.query.resolver';
import { RuleEngineService } from './rule-engine.service';
import {
  UserRoleAccessStrategy,
  UserSelfAccessStrategy,
  UserPermissionAccessStrategy,
  UserToWorkspaceAccessStrategy,
  WorkspaceOwnerAccessStrategy,
  WorkspacePermissionAccessStrategy,
} from './strategy';
import { ACCESS_STRATEGIES } from './strategy/interface';
import { UserPermissionService } from './user-permission.service';

@Module({
  exports: [AccessService, AccessGuard, UserPermissionService, UserPermissionsByUserIdLoader],
  imports: [AuthModule, PrismaModule, GroupModule],
  providers: [
    AccessService,
    AccessGuard,
    RuleEngineService,
    UserPermissionService,
    UserPermissionsByUserIdLoader,
    UserPermissionQueryResolver,
    // access strategies
    UserRoleAccessStrategy,
    UserSelfAccessStrategy,
    UserPermissionAccessStrategy,
    UserToWorkspaceAccessStrategy,
    WorkspaceOwnerAccessStrategy,
    WorkspacePermissionAccessStrategy,
    {
      inject: [
        UserRoleAccessStrategy,
        UserSelfAccessStrategy,
        UserPermissionAccessStrategy,
        UserToWorkspaceAccessStrategy,
        WorkspaceOwnerAccessStrategy,
        WorkspacePermissionAccessStrategy,
      ],
      provide: ACCESS_STRATEGIES,
      useFactory: (...strategies) => strategies,
    },
  ],
})
export class AccessModule {}
