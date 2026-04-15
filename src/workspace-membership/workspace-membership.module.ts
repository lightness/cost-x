import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UserLoaderModule } from '../user/user-loader.module';
import { WorkspaceInviteFieldResolver } from './resolver/workspace-invite.field.resolver';
import { WorkspaceMembershipFieldResolver } from './resolver/workspace-membership.field.resolver';
import { WorkspaceInviteMutationResolver } from './resolver/workspace-invite.mutation.resolver';
import { WorkspaceInviteValidationService } from './workspace-invite-validation.service';
import { WorkspaceInviteService } from './workspace-invite.service';

@Module({
  imports: [PrismaModule, AuthModule, AccessModule, UserLoaderModule],
  providers: [
    WorkspaceInviteService,
    WorkspaceInviteValidationService,
    // resolvers
    WorkspaceInviteMutationResolver,
    WorkspaceInviteFieldResolver,
    WorkspaceMembershipFieldResolver,
  ],
})
export class WorkspaceMembershipModule {}
