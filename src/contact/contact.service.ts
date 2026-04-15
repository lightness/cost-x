import { Injectable } from '@nestjs/common';
import { Contact } from '../../generated/prisma/browser';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async createContact(
    sourceUserId: number,
    targetUserId: number,
    inviteId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Contact> {
    return tx.contact.create({
      data: {
        createdAt: new Date(),
        invite: {
          connect: {
            id: inviteId,
          },
        },
        sourceUser: {
          connect: {
            id: sourceUserId,
          },
        },
        targetUser: {
          connect: {
            id: targetUserId,
          },
        },
      },
    });
  }

  async createContactPair(
    sourceUserId: number,
    targetUserId: number,
    inviteId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<[Contact, Contact]> {
    const directContact = await this.createContact(sourceUserId, targetUserId, inviteId, tx);
    const reverseContact = await this.createContact(targetUserId, sourceUserId, inviteId, tx);

    return [directContact, reverseContact];
  }

  async removeContact(
    contact: Contact,
    removedByUserId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Contact> {
    return tx.contact.update({
      data: {
        removedAt: new Date(),
        removedByUser: {
          connect: {
            id: removedByUserId,
          },
        },
      },
      where: { id: contact.id },
    });
  }

  async removeContactPairByUserIds(
    sourceUserId: number,
    targetUserId: number,
    removedByUserId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Contact[]> {
    return tx.contact.updateManyAndReturn({
      data: {
        removedAt: new Date(),
        removedByUserId,
      },
      where: {
        OR: [
          { sourceUserId, targetUserId },
          { sourceUserId: targetUserId, targetUserId: sourceUserId },
        ],
        removedAt: null,
      },
    });
  }

  async removeContactPair(
    contact: Contact,
    removedByUserId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<[Contact, Contact]> {
    const removedDirectContact = await this.removeContact(contact, removedByUserId, tx);
    const existingReverseContact = await this.getReverseContact(contact, tx);

    if (!existingReverseContact) {
      return [removedDirectContact, null];
    }

    const reverseContact = await this.removeContact(existingReverseContact, removedByUserId, tx);

    return [removedDirectContact, reverseContact];
  }

  async getReverseContact(
    contact: Contact,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Contact> {
    return tx.contact.findUnique({
      where: {
        removedAt: null,
        sourceUserId_targetUserId: {
          sourceUserId: contact.targetUserId,
          targetUserId: contact.sourceUserId,
        },
      },
    });
  }

  async isContactExists(
    sourceUserId: number,
    targetUserId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<boolean> {
    const count = await tx.contact.count({
      where: {
        removedAt: null,
        sourceUserId,
        targetUserId,
      },
    });

    return count > 0;
  }

  async listActiveByUserIds(
    userIds: number[],
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Contact[]> {
    return tx.contact.findMany({
      where: {
        removedAt: null,
        sourceUserId: { in: userIds },
      },
    });
  }

  async listActiveByUserId(
    userId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Contact[]> {
    return this.listActiveByUserIds([userId], tx);
  }
}
