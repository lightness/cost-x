import { Injectable } from '@nestjs/common';
import { Contact } from '../../generated/prisma/browser';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ContactValidationService } from './contact-validation.service';
import { UserBlockService } from './user-block.service';

@Injectable()
export class ContactService {
  constructor(
    private prisma: PrismaService,
    private userBlockService: UserBlockService,
    private contactValidationService: ContactValidationService,
  ) {}

  async createContact(
    sourceUserId: number,
    targetUserId: number,
    inviteId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Contact> {
    const client = tx || this.prisma;

    return client.contact.create({
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
    tx?: Prisma.TransactionClient,
  ): Promise<[Contact, Contact]> {
    const directContact = await this.createContact(sourceUserId, targetUserId, inviteId, tx);
    const reverseContact = await this.createContact(targetUserId, sourceUserId, inviteId, tx);

    return [directContact, reverseContact];
  }

  async removeContact(
    contactId: number,
    removedByUserId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Contact> {
    const client = tx || this.prisma;

    return client.contact.update({
      data: {
        removedAt: new Date(),
        removedByUser: {
          connect: {
            id: removedByUserId,
          },
        },
      },
      where: { id: contactId },
    });
  }

  async removeContactAndBlockUser(
    contactId: number,
    removedByUserId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<Contact> {
    const contact = await this.removeContact(contactId, removedByUserId, tx);

    const blockerUserId =
      contact.targetUserId === removedByUserId ? contact.targetUserId : contact.sourceUserId;
    const blockedUserId =
      contact.sourceUserId === removedByUserId ? contact.sourceUserId : contact.targetUserId;

    await this.userBlockService.blockUser(blockedUserId, blockerUserId, tx);

    return contact;
  }
}
