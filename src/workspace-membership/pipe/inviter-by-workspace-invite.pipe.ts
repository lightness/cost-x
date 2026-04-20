import { Injectable, NotFoundException, type PipeTransform } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import User from '../../user/entity/user.entity';
import { WorkspaceInvite } from '../entity/workspace-invite.entity';

@Injectable()
export class InviterByWorkspaceInvitePipe implements PipeTransform<WorkspaceInvite, Promise<User>> {
  constructor(private prisma: PrismaService) {}

  async transform(invite: WorkspaceInvite): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: invite.inviterId } });

    if (!user) {
      throw new NotFoundException(`User #${invite.inviterId} not found`);
    }

    return user;
  }
}
