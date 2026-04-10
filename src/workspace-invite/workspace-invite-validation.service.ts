import { Injectable } from '@nestjs/common';
import { Prisma, WorkspaceInviteStatus } from '../../generated/prisma/client';
import { ContactService } from '../contact/contact.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CannotRemoveWorkspaceOwnerError,
  ImproperWorkspaceInviteStatusError,
  InviteeNotAContactError,
  UserAlreadyWorkspaceMemberError,
  WorkspaceInviteAlreadyExistsError,
  WorkspaceInviteNotFoundError,
} from './error';
import { WorkspaceInvite } from './entity/workspace-invite.entity';
import { WorkspaceInviteService } from './workspace-invite.service';

@Injectable()
export class WorkspaceInviteValidationService {
  constructor(
    private prisma: PrismaService,
    private contactService: ContactService,
    private workspaceInviteService: WorkspaceInviteService,
  ) {}

  async validateCreateInvite(
    inviterId: number,
    workspaceId: number,
    inviteeUserId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const isContact = await this.contactService.isContactExists(inviterId, inviteeUserId, tx);

    if (!isContact) {
      throw new InviteeNotAContactError();
    }

    const isInviteExists = await this.workspaceInviteService.isInviteExists(
      workspaceId,
      inviteeUserId,
      tx,
    );

    if (isInviteExists) {
      throw new WorkspaceInviteAlreadyExistsError();
    }

    const isMember = await this.workspaceInviteService.isMemberExists(workspaceId, inviteeUserId, tx);

    if (isMember) {
      throw new UserAlreadyWorkspaceMemberError();
    }

    const workspace = await tx.workspace.findUniqueOrThrow({ where: { id: workspaceId } });

    if (workspace.ownerId === inviteeUserId) {
      throw new UserAlreadyWorkspaceMemberError('Invitee is already the workspace owner');
    }
  }

  async validateAcceptInvite(
    inviteId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceInvite> {
    const invite = await this.validateInviteExists(inviteId, tx);

    this.validateInviteIsInStatus(invite, WorkspaceInviteStatus.PENDING);

    const isMember = await this.workspaceInviteService.isMemberExists(
      invite.workspaceId,
      invite.inviteeId,
      tx,
    );

    if (isMember) {
      throw new UserAlreadyWorkspaceMemberError();
    }

    return invite;
  }

  async validateRejectInvite(
    inviteId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceInvite> {
    const invite = await this.validateInviteExists(inviteId, tx);

    this.validateInviteIsInStatus(invite, WorkspaceInviteStatus.PENDING);

    return invite;
  }

  async validateRemoveMember(
    workspaceId: number,
    userId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const workspace = await tx.workspace.findUniqueOrThrow({ where: { id: workspaceId } });

    if (workspace.ownerId === userId) {
      throw new CannotRemoveWorkspaceOwnerError();
    }

    const isMember = await this.workspaceInviteService.isMemberExists(workspaceId, userId, tx);

    if (!isMember) {
      throw new WorkspaceInviteNotFoundError('User is not a member of this workspace');
    }
  }

  private async validateInviteExists(
    inviteId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<WorkspaceInvite> {
    const invite = await tx.workspaceInvite.findUnique({ where: { id: inviteId } });

    if (!invite) {
      throw new WorkspaceInviteNotFoundError();
    }

    return invite;
  }

  private validateInviteIsInStatus(invite: WorkspaceInvite, ...statuses: WorkspaceInviteStatus[]) {
    if (!statuses.includes(invite.status)) {
      throw new ImproperWorkspaceInviteStatusError(
        `Workspace invite is in improper status: ${invite.status}`,
      );
    }
  }
}
