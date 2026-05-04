import { Injectable, NotFoundException, type PipeTransform } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import User from '../../user/entity/user.entity';
import { WorkspaceMember } from '../entity/workspace-member.entity';

@Injectable()
export class UserByWorkspaceMemberPipe
  implements PipeTransform<WorkspaceMember, Promise<User>>
{
  constructor(private prisma: PrismaService) {}

  async transform(member: WorkspaceMember): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: member.userId } });

    if (!user) {
      throw new NotFoundException(`User #${member.userId} not found`);
    }

    return user;
  }
}
