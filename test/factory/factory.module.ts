import { Module } from '@nestjs/common';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { ContactFactoryService } from './contact-factory.service';
import { InviteFactoryService } from './invite-factory.service';
import { UserBlockFactoryService } from './user-block-factory.service';
import { UserFactoryService } from './user-factory.service';

const factories = [
  ContactFactoryService,
  InviteFactoryService,
  UserBlockFactoryService,
  UserFactoryService,
];

@Module({
  exports: [...factories],
  imports: [PrismaModule],
  providers: [...factories],
})
export class FactoryModule {}
