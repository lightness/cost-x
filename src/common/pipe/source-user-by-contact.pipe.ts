import { Injectable, NotFoundException, type PipeTransform } from '@nestjs/common';
import { Contact } from '../../contact/entity/contact.entity';
import { PrismaService } from '../../prisma/prisma.service';
import User from '../../user/entity/user.entity';

@Injectable()
export class SourceUserByContactPipe implements PipeTransform<Contact, Promise<User>> {
  constructor(private prisma: PrismaService) {}

  async transform(contact: Contact): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: contact.sourceUserId } });

    if (!user) {
      throw new NotFoundException(`User #${contact.sourceUserId} not found`);
    }

    return user;
  }
}
