import { Injectable } from '@nestjs/common';
import { Prisma, WorkspaceInviteStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceInvite } from './entity/workspace-invite.entity';
import {
  ImproperWorkspaceInviteStatusError,
  UserAlreadyWorkspaceMemberError,
  WorkspaceInviteAlreadyExistsError,
} from './error';

@Injectable()
export class WorkspaceInviteValidationService {
  constructor(private prisma: PrismaService) {}

  async validateCreateInvite(
    workspaceId: number,
    inviteeId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    await this.validateInviteNotExists(workspaceId, inviteeId, tx);
    await this.validateNotAlreadyMember(workspaceId, inviteeId, tx);
  }

  async validateAcceptInvite(
    invite: WorkspaceInvite,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    this.validateInviteIsInStatus(invite, WorkspaceInviteStatus.PENDING);
    await this.validateNotAlreadyMember(invite.workspaceId, invite.inviteeId, tx);
  }

  validateRejectInvite(invite: WorkspaceInvite): void {
    this.validateInviteIsInStatus(invite, WorkspaceInviteStatus.PENDING);
  }

  validateCancelInvite(invite: WorkspaceInvite): void {
    this.validateInviteIsInStatus(invite, WorkspaceInviteStatus.PENDING);
  }

  private async validateInviteNotExists(
    workspaceId: number,
    inviteeId: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const existing = await tx.workspaceInvite.findFirst({
      where: { inviteeId, reactedAt: null, workspaceId },
    });

    if (existing) {
      throw new WorkspaceInviteAlreadyExistsError();
    }
  }

  private async validateNotAlreadyMember(
    workspaceId: number,
    userId: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const existing = await tx.workspaceMember.findFirst({
      where: { removedAt: null, userId, workspaceId },
    });

    if (existing) {
      throw new UserAlreadyWorkspaceMemberError();
    }
  }

  private validateInviteIsInStatus(
    invite: WorkspaceInvite,
    ...statuses: WorkspaceInviteStatus[]
  ): void {
    if (!statuses.includes(invite.status)) {
      throw new ImproperWorkspaceInviteStatusError(
        `Improper workspace invite status: ${invite.status}`,
      );
    }
  }
}
