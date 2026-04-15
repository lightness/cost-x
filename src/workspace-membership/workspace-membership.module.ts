import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkspaceMembershipFieldResolver } from './resolver/workspace-membership.field.resolver';
import { WorkspaceInviteMutationResolver } from './resolver/workspace-invite.mutation.resolver';
import { WorkspaceInviteValidationService } from './workspace-invite-validation.service';
import { WorkspaceInviteService } from './workspace-invite.service';

@Module({
  imports: [PrismaModule, AuthModule, AccessModule],
  providers: [
    WorkspaceInviteService,
    WorkspaceInviteValidationService,
    // resolvers
    WorkspaceInviteMutationResolver,
    WorkspaceMembershipFieldResolver,
  ],
})
export class WorkspaceMembershipModule {}
