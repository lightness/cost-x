import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AccessService } from './access.service';
import { AccessGuard } from './guard/access.guard';

@Module({
  imports: [PrismaModule],
  providers: [AccessService, AccessGuard],
  exports: [AccessService, AccessGuard],
})
export class AccessModule { }