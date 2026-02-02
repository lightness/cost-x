import { Injectable } from '@nestjs/common';
import { WorkspaceWhereInput } from '../../generated/prisma/models';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../user/entity/user.entity';
import { WorkspaceInDto, WorkspacesFilter } from './dto';
import { Workspace } from './entity/workspace.entity';

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  async listByOwnerIds(
    ownerIds: number[],
    filters: WorkspacesFilter,
  ): Promise<Workspace[]> {
    return this.prisma.workspace.findMany({
      where: this.getWhereClause(ownerIds, filters),
    });
  }

  async create(dto: WorkspaceInDto, currentUser: User): Promise<Workspace> {
    return this.prisma.workspace.create({
      data: {
        defaultCurrency: dto.defaultCurrency,
        owner: {
          connect: currentUser,
        },
        title: dto.title,
      },
      include: {
        owner: true,
      },
    });
  }

  async update(id: number, dto: WorkspaceInDto): Promise<Workspace> {
    return this.prisma.workspace.update({
      data: {
        defaultCurrency: dto.defaultCurrency,
        title: dto.title,
      },
      where: { id },
    });
  }

  async delete(id: number): Promise<Workspace> {
    return this.prisma.workspace.delete({ where: { id } });
  }

  // private

  private getWhereClause(
    ownerIds: number[],
    filters: WorkspacesFilter,
  ): WorkspaceWhereInput {
    return {
      defaultCurrency: filters.defaultCurrency
        ? { equals: filters.defaultCurrency }
        : undefined,
      ownerId: { in: ownerIds },
      title: filters.title
        ? { contains: filters.title, mode: 'insensitive' }
        : undefined,
    };
  }
}
