import { Injectable } from '@nestjs/common';
import { Currency } from '../../generated/prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';
import { Workspace } from '../../src/workspace/entity/workspace.entity';

@Injectable()
export class WorkspaceFactoryService {
  constructor(private prisma: PrismaService) {}

  async create(overrides: { ownerId: number; title?: string; defaultCurrency?: Currency }): Promise<Workspace> {
    return this.prisma.workspace.create({
      data: {
        defaultCurrency: overrides.defaultCurrency ?? Currency.USD,
        ownerId: overrides.ownerId,
        title: overrides.title ?? `Workspace ${Date.now()}`,
      },
    });
  }
}
