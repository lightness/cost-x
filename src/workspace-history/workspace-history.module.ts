import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { WorkspaceHistoryEventListenerService } from './workspace-history-event-listener.service';
import { WorkspaceHistoryFieldResolver } from './resolver/workspace-history.field.resolver';
import { WorkspaceHistoryService } from './workspace-history.service';

@Module({
  exports: [WorkspaceHistoryService],
  imports: [PrismaModule, forwardRef(() => UserModule)],
  providers: [WorkspaceHistoryService, WorkspaceHistoryEventListenerService, WorkspaceHistoryFieldResolver],
})
export class WorkspaceHistoryModule {}
