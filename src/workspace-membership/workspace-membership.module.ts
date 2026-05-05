import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { GroupModule } from '../group/group.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UserLoaderModule } from '../user/user-loader.module';
import { WorkspaceInviteByInviteIdLoader } from './dataloader/workspace-invite-by-invite-id.loader';
import { WorkspaceInviteFieldResolver } from './resolver/workspace-invite.field.resolver';
import { WorkspaceInviteMutationResolver } from './resolver/workspace-invite.mutation.resolver';
import { WorkspaceMemberPermissionMutationResolver } from './resolver/workspace-member-permission.mutation.resolver';
import { WorkspaceMemberFieldResolver } from './resolver/workspace-member.field.resolver';
import { WorkspaceMemberMutationResolver } from './resolver/workspace-member.mutation.resolver';
import { WorkspaceMembershipFieldResolver } from './resolver/workspace-membership.field.resolver';
import { WorkspaceInviteValidationService } from './workspace-invite-validation.service';
import { WorkspaceInviteService } from './workspace-invite.service';
import { WorkspaceMemberPermissionService } from './workspace-member-permission.service';
import { WorkspaceMemberService } from './workspace-member.service';

@Module({
  exports: [WorkspaceMemberService],
  imports: [PrismaModule, AuthModule, AccessModule, GroupModule, UserLoaderModule],
  providers: [
    WorkspaceInviteService,
    WorkspaceInviteValidationService,
    WorkspaceMemberService,
    WorkspaceMemberPermissionService,
    // resolvers
    WorkspaceInviteMutationResolver,
    WorkspaceMemberMutationResolver,
    WorkspaceMemberPermissionMutationResolver,
    WorkspaceInviteFieldResolver,
    WorkspaceMemberFieldResolver,
    WorkspaceMembershipFieldResolver,
    // dataloaders
    WorkspaceInviteByInviteIdLoader,
  ],
})
export class WorkspaceMembershipModule {}
