import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkspaceHistoryEventListenerService } from './workspace-history-event-listener.service';
import { WorkspaceHistoryService } from './workspace-history.service';

@Module({
  exports: [WorkspaceHistoryService],
  imports: [PrismaModule],
  providers: [WorkspaceHistoryService, WorkspaceHistoryEventListenerService],
})
export class WorkspaceHistoryModule {}
