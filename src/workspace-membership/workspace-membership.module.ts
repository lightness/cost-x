import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { GroupModule } from '../group/group.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UserLoaderModule } from '../user/user-loader.module';
import { WorkspaceInviteByInviteIdLoader } from './dataloader/workspace-invite-by-invite-id.loader';
import { WorkspaceInviteFieldResolver } from './resolver/workspace-invite.field.resolver';
import { WorkspaceMemberFieldResolver } from './resolver/workspace-member.field.resolver';
import { WorkspaceMembershipFieldResolver } from './resolver/workspace-membership.field.resolver';
import { WorkspaceInviteMutationResolver } from './resolver/workspace-invite.mutation.resolver';
import { WorkspaceInviteValidationService } from './workspace-invite-validation.service';
import { WorkspaceInviteService } from './workspace-invite.service';

@Module({
  imports: [PrismaModule, AuthModule, AccessModule, GroupModule, UserLoaderModule],
  providers: [
    WorkspaceInviteService,
    WorkspaceInviteValidationService,
    // resolvers
    WorkspaceInviteMutationResolver,
    WorkspaceInviteFieldResolver,
    WorkspaceMemberFieldResolver,
    WorkspaceMembershipFieldResolver,
    // dataloaders
    WorkspaceInviteByInviteIdLoader,
  ],
})
export class WorkspaceMembershipModule {}
