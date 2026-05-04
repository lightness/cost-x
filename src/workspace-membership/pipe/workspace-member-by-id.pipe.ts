import { Injectable, type PipeTransform } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkspaceMember } from '../entity/workspace-member.entity';
import { WorkspaceMemberNotFoundError } from '../error';

@Injectable()
export class WorkspaceMemberByIdPipe implements PipeTransform<number, Promise<WorkspaceMember>> {
  constructor(private prisma: PrismaService) {}

  async transform(value: number): Promise<WorkspaceMember> {
    const member = await this.prisma.workspaceMember.findUnique({ where: { id: value } });

    if (!member) {
      throw new WorkspaceMemberNotFoundError();
    }

    return member;
  }
}
