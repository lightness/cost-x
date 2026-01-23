import { Module } from '@nestjs/common';
import { ConsistencyService } from './consistency.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  exports: [ConsistencyService],
  imports: [PrismaModule],
  providers: [ConsistencyService],
})
export class ConsistencyModule {}
