import { Injectable } from '@nestjs/common';
import { Contact } from '../../generated/prisma/client';
import { ContactCreateInput, ContactCreateManyInput } from '../../generated/prisma/models';
import { PrismaService } from '../../src/prisma/prisma.service';
import { KindBasedFactoryService } from './base-factory.service';
import { InviteFactoryService } from './invite-factory.service';
import { UserFactoryService } from './user-factory.service';

export type ContactKind = 'active' | 'removed-by-source-user' | 'removed-by-target-user';

@Injectable()
export class ContactFactoryService
  implements
    KindBasedFactoryService<ContactKind, Contact, ContactCreateManyInput, ContactCreateInput>
{
  constructor(
    private prisma: PrismaService,
    private userFactory: UserFactoryService,
    private inviteFactory: InviteFactoryService,
  ) {}

  async create(
    kind: ContactKind = 'active',
    overrides: Partial<ContactCreateManyInput> = {},
  ): Promise<Contact> {
    return this.prisma.contact.create({
      data: {
        ...(await this.generate(kind, overrides)),
      },
    });
  }

  async createActivePair(
    overrides: Partial<ContactCreateManyInput> = {},
  ): Promise<[Contact, Contact]> {
    const contact1 = await this.create('active', overrides);
    const contact2 = await this.create('active', {
      ...overrides,
      sourceUserId: contact1.targetUserId,
      targetUserId: contact1.sourceUserId,
    });

    return [contact1, contact2];
  }

  async createRemovedPair(
    overrides: Partial<ContactCreateManyInput> = {},
  ): Promise<[Contact, Contact]> {
    const contact1 = await this.create('removed-by-source-user', overrides);
    const contact2 = await this.create('removed-by-target-user', {
      ...overrides,
      sourceUserId: contact1.targetUserId,
      targetUserId: contact1.sourceUserId,
    });

    return [contact1, contact2];
  }

  async generate(
    kind: ContactKind = 'active',
    overrides: Partial<ContactCreateManyInput> = {},
  ): Promise<ContactCreateInput> {
    const { sourceUserId, targetUserId, inviteId, ...restOverrides } = overrides;

    const resolvedSourceUserId = overrides?.sourceUserId || (await this.generateSourceUserId());
    const resolvedTargetUserId = overrides?.targetUserId || (await this.generateTargetUserId());
    const resolvedInviteId =
      overrides?.inviteId ||
      (await this.generateInviteId(resolvedSourceUserId, resolvedTargetUserId));
    const removedByUserId =
      overrides?.removedByUserId ||
      this.generateRemovedByUserId(kind, resolvedSourceUserId, resolvedTargetUserId);

    return {
      invite: {
        connect: {
          id: resolvedInviteId,
        },
      },
      removedAt: this.generateRemovedAt(kind),
      removedByUser: removedByUserId ? { connect: { id: removedByUserId } } : undefined,
      sourceUser: {
        connect: {
          id: resolvedSourceUserId,
        },
      },
      targetUser: {
        connect: {
          id: resolvedTargetUserId,
        },
      },
      ...restOverrides,
    };
  }

  async generateTargetUserId(): Promise<number> {
    return (await this.userFactory.create('active')).id;
  }

  async generateSourceUserId(): Promise<number> {
    return (await this.userFactory.create('active')).id;
  }

  async generateInviteId(inviterId?: number, inviteeId?: number): Promise<number> {
    return (await this.inviteFactory.create('accepted', { inviteeId, inviterId })).id;
  }

  generateRemovedByUserId(
    kind: ContactKind,
    sourceUserId: number,
    targetUserId: number,
  ): number | null {
    switch (kind) {
      case 'active':
        return null;
      case 'removed-by-source-user':
        return sourceUserId;
      case 'removed-by-target-user':
        return targetUserId;
    }
  }

  generateRemovedAt(kind: ContactKind): Date {
    if (kind === 'active') {
      return null;
    } else {
      return new Date(); // TODO: add some random
    }
  }
}
