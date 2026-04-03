import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { WorkspaceWhereInput } from '../../generated/prisma/models';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '../user/entity/user.entity';
import { WorkspaceInDto, WorkspacesFilter } from './dto';
import { Workspace } from './entity/workspace.entity';

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  async listByOwnerIds(ownerIds: number[], filters: WorkspacesFilter): Promise<Workspace[]> {
    return this.prisma.workspace.findMany({
      where: this.getWhereClause(ownerIds, filters),
    });
  }

  async create(
    dto: WorkspaceInDto,
    currentUser: User,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Workspace> {
    return tx.workspace.create({
      data: {
        defaultCurrency: dto.defaultCurrency,
        owner: {
          connect: {
            id: currentUser.id,
          },
        },
        title: dto.title,
      },
      include: {
        owner: true,
      },
    });
  }

  async update(
    id: number,
    dto: WorkspaceInDto,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Workspace> {
    return tx.workspace.update({
      data: {
        defaultCurrency: dto.defaultCurrency,
        title: dto.title,
      },
      where: { id },
    });
  }

  async delete(id: number, tx: Prisma.TransactionClient = this.prisma): Promise<Workspace> {
    return tx.workspace.delete({ where: { id } });
  }

  // private

  private getWhereClause(ownerIds: number[], filters: WorkspacesFilter): WorkspaceWhereInput {
    return {
      defaultCurrency: filters.defaultCurrency ? { equals: filters.defaultCurrency } : undefined,
      id: filters.id ? { equals: filters.id } : undefined,
      ownerId: { in: ownerIds },
      title: filters.title ? { contains: filters.title, mode: 'insensitive' } : undefined,
    };
  }
}
