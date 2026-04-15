import { Injectable, NotFoundException, type PipeTransform } from '@nestjs/common';
import { Invite } from '../../contact/entity/invite.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InviteByIdPipe implements PipeTransform<number, Promise<Invite>> {
  constructor(private prisma: PrismaService) {}

  async transform(value: number): Promise<Invite> {
    const invite = await this.prisma.invite.findUnique({ where: { id: value } });

    if (!invite) {
      throw new NotFoundException(`Invite #${value} not found`);
    }

    return invite;
  }
}
