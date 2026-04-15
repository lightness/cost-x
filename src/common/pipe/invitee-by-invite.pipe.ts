import { Injectable, NotFoundException, type PipeTransform } from '@nestjs/common';
import { Invite } from '../../contact/entity/invite.entity';
import { PrismaService } from '../../prisma/prisma.service';
import User from '../../user/entity/user.entity';

@Injectable()
export class InviteeByInvitePipe implements PipeTransform<Invite, Promise<User>> {
  constructor(private prisma: PrismaService) {}

  async transform(invite: Invite): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: invite.inviteeId } });

    if (!user) {
      throw new NotFoundException(`User #${invite.inviteeId} not found`);
    }

    return user;
  }
}
