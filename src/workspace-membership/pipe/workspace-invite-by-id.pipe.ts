import { Injectable, type PipeTransform } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspaceInvite } from '../entity/workspace-invite.entity';
import { WorkspaceInviteNotFoundError } from '../error/workspace-invite-not-found.error';

@Injectable()
export class WorkspaceInviteByIdPipe implements PipeTransform<number, Promise<WorkspaceInvite>> {
  constructor(private prisma: PrismaService) {}

  async transform(value: number): Promise<WorkspaceInvite> {
    const invite = await this.prisma.workspaceInvite.findUnique({ where: { id: value } });

    if (!invite) {
      throw new WorkspaceInviteNotFoundError();
    }

    return invite;
  }
}
