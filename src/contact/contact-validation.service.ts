import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/browser';
import { PrismaService } from '../prisma/prisma.service';
import { Contact } from './entity/contact.entity';
import { ContactAlreadyRemovedError } from './error/contact-already-removed.error';

@Injectable()
export class ContactValidationService {
  constructor(private prisma: PrismaService) {}

  async validateDeleteContact(contact: Contact, _tx: Prisma.TransactionClient = this.prisma) {
    this.validateContactIsActive(contact);
  }

  private validateContactIsActive(contact: Contact) {
    if (contact.removedAt || contact.removedByUserId) {
      throw new ContactAlreadyRemovedError();
    }
  }
}
