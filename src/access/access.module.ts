import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AccessService } from './access.service';
import { AccessGuard } from './guard/access.guard';
import { PermissionService } from './permission.service';
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
  UserToWorkspaceMemberAccessStrategy,
} from './strategy';
import { ACCESS_STRATEGIES } from './strategy/interface';

@Module({
  exports: [AccessService, AccessGuard],
  imports: [PrismaModule],
  providers: [
    AccessService,
    AccessGuard,
    PermissionService,
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
    UserToWorkspaceMemberAccessStrategy,
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
        UserToWorkspaceMemberAccessStrategy,
      ],
      provide: ACCESS_STRATEGIES,
      useFactory: (...strategies) => strategies,
    },
  ],
})
export class AccessModule {}
