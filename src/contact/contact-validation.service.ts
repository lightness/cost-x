import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/browser';
import { PrismaService } from '../prisma/prisma.service';
import { Contact } from './entity/contact.entity';
import { ContactNotFoundError } from './error';
import { ContactAlreadyRemovedError } from './error/contact-already-removed.error';

@Injectable()
export class ContactValidationService {
  constructor(private prisma: PrismaService) {}

  async validateDeleteContact(contactId: number, tx: Prisma.TransactionClient = this.prisma) {
    const contact = await this.validateContactExists(contactId, tx);

    console.log('###', contact);

    this.validateContactIsActive(contact);
  }

  private async validateContactExists(
    contactId: number,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Contact> {
    const contact = await tx.contact.findUnique({ where: { id: contactId } });

    if (!contact) {
      throw new ContactNotFoundError();
    }

    return contact;
  }

  private validateContactIsActive(contact: Contact) {
    if (contact.removedAt || contact.removedByUserId) {
      throw new ContactAlreadyRemovedError();
    }
  }
}
