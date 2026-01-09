import { Module } from '@nestjs/common';
import { ConsistencyService } from './consistency.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ConsistencyService],
  exports: [ConsistencyService],
})
export class ConsistencyModule {}