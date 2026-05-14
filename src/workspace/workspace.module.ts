import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { GroupModule } from '../group/group.module';
import { ItemModule } from '../item/item.module';
import { ItemsAggregationModule } from '../items-aggregation/items-aggregation.module';
import { PaymentBalanceModule } from '../payment-balance/payment-balance.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TagModule } from '../tag/tag.module';
import { WorkspaceHistoriesByWorkspaceIdLoader } from '../workspace-history/dataloader/workspace-histories-by-workspace-id.loader.service';
import { WorkspaceHistoryModule } from '../workspace-history/workspace-history.module';
import { WorkspaceMembershipModule } from '../workspace-membership/workspace-membership.module';
import { WorkspacesByUserIdLoader } from './dataloader/workspaces-by-user-id.loader';
import { WorkspaceHistoryFieldResolver } from './resolver/workspace-history.field.resolver';
import { WorkspaceMutationResolver } from './resolver/workspace.mutation.resolver';
import { WorkspaceService } from './workspace.service';

@Module({
  exports: [WorkspaceService, WorkspacesByUserIdLoader],
  imports: [
    PrismaModule,
    AuthModule,
    AccessModule,
    ItemModule,
    TagModule,
    ItemsAggregationModule,
    GroupModule,
    WorkspaceHistoryModule,
    WorkspaceMembershipModule,
    PaymentBalanceModule,
  ],
  providers: [
    WorkspaceService,
    // resolvers
    WorkspaceMutationResolver,
    WorkspaceHistoryFieldResolver,
    // dataloaders
    WorkspacesByUserIdLoader,
    WorkspaceHistoriesByWorkspaceIdLoader,
  ],
})
export class WorkspaceModule {}
