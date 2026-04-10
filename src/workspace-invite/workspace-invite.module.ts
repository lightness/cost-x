import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { ContactModule } from '../contact/contact.module';
import { GroupModule } from '../group/group.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UserLoaderModule } from '../user/user-loader.module';
import { WorkspaceInvitesByInviteeIdLoader } from './dataloader/workspace-invites-by-invitee-id.loader';
import { WorkspaceMembersByWorkspaceIdLoader } from './dataloader/workspace-members-by-workspace-id.loader';
import { WorkspacePendingInvitesByWorkspaceIdLoader } from './dataloader/workspace-pending-invites-by-workspace-id.loader';
import { WorkspaceInviteFieldsResolver } from './resolver/workspace-invite.fields.resolver';
import { WorkspaceInviteMutationResolver } from './resolver/workspace-invite.mutation.resolver';
import { WorkspaceMemberFieldsResolver } from './resolver/workspace-member.fields.resolver';
import { WorkspaceInviteValidationService } from './workspace-invite-validation.service';
import { WorkspaceInviteService } from './workspace-invite.service';

@Module({
  exports: [
    WorkspaceInviteService,
    WorkspaceInvitesByInviteeIdLoader,
    WorkspaceMembersByWorkspaceIdLoader,
    WorkspacePendingInvitesByWorkspaceIdLoader,
  ],
  imports: [
    PrismaModule,
    AuthModule,
    AccessModule,
    GroupModule,
    ContactModule,
    UserLoaderModule,
  ],
  providers: [
    WorkspaceInviteService,
    WorkspaceInviteValidationService,
    // resolvers
    WorkspaceInviteMutationResolver,
    WorkspaceInviteFieldsResolver,
    WorkspaceMemberFieldsResolver,
    // dataloaders
    WorkspaceInvitesByInviteeIdLoader,
    WorkspaceMembersByWorkspaceIdLoader,
    WorkspacePendingInvitesByWorkspaceIdLoader,
  ],
})
export class WorkspaceInviteModule {}
