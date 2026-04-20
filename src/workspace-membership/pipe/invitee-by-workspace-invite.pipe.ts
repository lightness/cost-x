import { Injectable, NotFoundException, type PipeTransform } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import User from '../../user/entity/user.entity';
import { WorkspaceInvite } from '../entity/workspace-invite.entity';

@Injectable()
export class InviteeByWorkspaceInvitePipe implements PipeTransform<WorkspaceInvite, Promise<User>> {
  constructor(private prisma: PrismaService) {}

  async transform(invite: WorkspaceInvite): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: invite.inviteeId } });

    if (!user) {
      throw new NotFoundException(`User #${invite.inviteeId} not found`);
    }

    return user;
  }
}
