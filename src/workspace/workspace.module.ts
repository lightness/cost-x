import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkspaceResolver } from './resolver/workspace.resolver';
import { WorkspaceService } from './workspace.service';

@Module({
  imports: [PrismaModule, AuthModule, AccessModule],
  providers: [WorkspaceService, WorkspaceResolver],
  exports: [WorkspaceService]
})
export class WorkspaceModule {}
