import { Injectable, NotFoundException, type PipeTransform } from '@nestjs/common';
import { Contact } from '../../contact/entity/contact.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContactByIdPipe implements PipeTransform<number, Promise<Contact>> {
  constructor(private prisma: PrismaService) {}

  async transform(value: number): Promise<Contact> {
    const contact = await this.prisma.contact.findUnique({ where: { id: value } });

    if (!contact) {
      throw new NotFoundException(`Contact #${value} not found`);
    }

    return contact;
  }
}
