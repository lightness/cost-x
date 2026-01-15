import { Injectable } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import type { User } from '../user/entities/user.entity';
import type { WorkspaceInDto } from './dto';
import type { Workspace } from './entity/workspace.entity';

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  async listByOwnerId(ownerId: number): Promise<Workspace[]> {
    return this.prisma.workspace.findMany({
      where: { ownerId },
    });
  }

  async create(dto: WorkspaceInDto, currentUser: User): Promise<Workspace> {
    return this.prisma.workspace.create({
      data: {
        title: dto.title,
        owner: {
          connect: currentUser,
        },
      },
      include: {
        owner: true,
      },
    });
  }

  async update(id: number, dto: WorkspaceInDto): Promise<Workspace> {
    return this.prisma.workspace.update({
      where: { id },
      data: {
        title: dto.title,
      },
    });
  }

  async delete(id: number): Promise<Workspace> {
    return this.prisma.workspace.delete({ where: { id } });
  }
}
