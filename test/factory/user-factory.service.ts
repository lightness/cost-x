import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';

@Injectable()
export class UserFactoryService {
  constructor(private prisma: PrismaService) {}

  protected get repo() {
    return this.prisma.user;
  }
}
