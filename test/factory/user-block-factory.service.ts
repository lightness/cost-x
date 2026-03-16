import { Injectable } from '@nestjs/common';
import { UserBlock } from '../../generated/prisma/client';
import { UserBlockCreateInput, UserBlockCreateManyInput } from '../../generated/prisma/models';
import { PrismaService } from '../../src/prisma/prisma.service';
import { KindBasedFactoryService } from './base-factory.service';
import { UserFactoryService } from './user-factory.service';

export type UserBlockKind = 'active' | 'removed';

@Injectable()
export class UserBlockFactoryService
  implements
    KindBasedFactoryService<
      UserBlockKind,
      UserBlock,
      UserBlockCreateManyInput,
      UserBlockCreateInput
    >
{
  constructor(
    private prisma: PrismaService,
    private userFactory: UserFactoryService,
  ) {}

  async create(
    kind: UserBlockKind = 'active',
    overrides: Partial<UserBlockCreateManyInput> = {},
  ): Promise<UserBlock> {
    return this.prisma.userBlock.create({
      data: {
        ...(await this.generate(kind, overrides)),
      },
    });
  }

  async generate(
    kind: UserBlockKind = 'active',
    overrides: Partial<UserBlockCreateManyInput> = {},
  ): Promise<UserBlockCreateInput> {
    const { blockerId, blockedId, ...restOverrides } = overrides;

    const resolvedBlockedId = overrides?.blockedId || (await this.generateBlockedId());
    const resolvedBlockerId = overrides?.blockerId || (await this.generateBlockerId());
    const resolvedRemovedByUserId =
      overrides?.removedByUserId || (await this.generateRemovedByUser(kind, resolvedBlockerId));

    return {
      blocked: {
        connect: {
          id: resolvedBlockedId,
        },
      },
      blocker: {
        connect: {
          id: resolvedBlockerId,
        },
      },
      removedAt: this.generateRemovedAt(kind),
      removedByUser: resolvedRemovedByUserId
        ? { connect: { id: resolvedRemovedByUserId } }
        : undefined,
      ...restOverrides,
    };
  }

  async generateBlockedId(): Promise<number> {
    return (await this.userFactory.create('active')).id;
  }

  async generateBlockerId(): Promise<number> {
    return (await this.userFactory.create('active')).id;
  }

  generateRemovedAt(kind: UserBlockKind): Date {
    if (kind === 'removed') {
      return new Date(); // TODO: add some random
    }

    return null;
  }

  generateRemovedByUser(kind: UserBlockKind, blockerId: number): number | null {
    if (kind === 'removed') {
      return blockerId;
    }

    return null;
  }
}
