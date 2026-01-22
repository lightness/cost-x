import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { ItemModule } from '../item/item.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkspacesByUserIdLoader } from './dataloader/workspaces-by-user-id.loader';
import { WorkspaceResolver } from './resolver/workspace.resolver';
import { WorkspaceService } from './workspace.service';
import { GroupModule } from '../group/group.module';
import { TagModule } from '../tag/tag.module';
import { ItemsAggregationModule } from '../items-aggregation/items-aggregation.module';

@Module({
  imports: [
    PrismaModule, 
    AuthModule, 
    AccessModule, 
    ItemModule,
    TagModule,
    ItemsAggregationModule,
    GroupModule,
  ],
  providers: [
    WorkspaceService, 
    // resolver
    WorkspaceResolver,
    // dataloader
    WorkspacesByUserIdLoader,
  ],
  exports: [
    WorkspaceService,
    WorkspacesByUserIdLoader,
  ],
})
export class WorkspaceModule {}
