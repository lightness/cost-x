import { Injectable } from '@nestjs/common';
import { Invite } from '../../generated/prisma/client';
import { InviteStatus } from '../../generated/prisma/enums';
import { InviteCreateInput, InviteCreateManyInput } from '../../generated/prisma/models';
import { PrismaService } from '../../src/prisma/prisma.service';
import { KindBasedFactoryService } from './base-factory.service';
import { UserFactoryService } from './user-factory.service';

export type InviteKind = 'pending' | 'accepted' | 'rejected';

@Injectable()
export class InviteFactoryService
  implements KindBasedFactoryService<InviteKind, Invite, InviteCreateManyInput, InviteCreateInput>
{
  constructor(
    private prisma: PrismaService,
    private userFactory: UserFactoryService,
  ) {}

  async create(
    kind: InviteKind = 'pending',
    overrides: Partial<InviteCreateManyInput> = {},
  ): Promise<Invite> {
    return this.prisma.invite.create({
      data: {
        ...(await this.generate(kind, overrides)),
      },
    });
  }

  async generate(
    kind: InviteKind = 'pending',
    overrides: Partial<InviteCreateManyInput> = {},
  ): Promise<InviteCreateInput> {
    const { inviteeId, inviterId, ...restOverrides } = overrides;

    return {
      invitee: {
        connect: {
          id: overrides?.inviteeId || (await this.generateInviteeId()),
        },
      },
      inviter: {
        connect: {
          id: overrides.inviterId || (await this.generateInviterId()),
        },
      },
      reactedAt: this.generateReactedAt(kind),
      status: this.generateStatus(kind),
      ...restOverrides,
    };
  }

  async generateInviteeId(): Promise<number> {
    return (await this.userFactory.create('active')).id;
  }

  async generateInviterId(): Promise<number> {
    return (await this.userFactory.create('active')).id;
  }

  generateReactedAt(kind: InviteKind): Date {
    if (kind === 'pending') {
      return null;
    } else {
      return new Date(); // TODO: add some random
    }
  }

  generateStatus(kind: InviteKind): InviteStatus {
    switch (kind) {
      case 'pending':
        return InviteStatus.PENDING;
      case 'accepted':
        return InviteStatus.ACCEPTED;
      case 'rejected':
        return InviteStatus.REJECTED;
    }
  }
}
