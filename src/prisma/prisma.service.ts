import { Injectable } from '@nestjs/common';
import type { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(adapter: PrismaPg) {
    super({ adapter });
  }
}
