import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { GroupModule } from '../group/group.module';
import { ItemModule } from '../item/item.module';
import { ItemsAggregationModule } from '../items-aggregation/items-aggregation.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TagModule } from '../tag/tag.module';
import { WorkspaceHistoryModule } from '../workspace-history/workspace-history.module';
import { WorkspaceInviteModule } from '../workspace-invite/workspace-invite.module';
import { SharedWorkspacesByUserIdLoader } from './dataloader/shared-workspaces-by-user-id.loader';
import { WorkspacesByUserIdLoader } from './dataloader/workspaces-by-user-id.loader';
import { WorkspaceFieldResolver } from './resolver/workspace.field.resolver';
import { WorkspaceMutationResolver } from './resolver/workspace.mutation.resolver';
import { WorkspaceService } from './workspace.service';

@Module({
  exports: [WorkspaceService, WorkspacesByUserIdLoader, SharedWorkspacesByUserIdLoader],
  imports: [
    PrismaModule,
    AuthModule,
    AccessModule,
    ItemModule,
    TagModule,
    ItemsAggregationModule,
    GroupModule,
    WorkspaceHistoryModule,
    WorkspaceInviteModule,
  ],
  providers: [
    WorkspaceService,
    // resolvers
    WorkspaceFieldResolver,
    WorkspaceMutationResolver,
    // dataloaders
    WorkspacesByUserIdLoader,
    SharedWorkspacesByUserIdLoader,
  ],
})
export class WorkspaceModule {}
