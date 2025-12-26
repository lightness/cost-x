import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TestItemService {
  constructor(private prisma: PrismaService) {}

  async test() {
    return this.prisma.item.findMany();
  }
}