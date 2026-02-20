import { Module } from '@nestjs/common';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { UserFactoryService } from './user-factory.service';

@Module({
  exports: [UserFactoryService],
  imports: [PrismaModule],
  providers: [UserFactoryService],
})
export class FactoryModule {}
