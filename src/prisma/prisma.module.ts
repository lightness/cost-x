import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { providers } from './prisma.providers';
import { PrismaService } from './prisma.service';

@Module({
  imports: [ConfigModule],
  providers: [PrismaService, ...providers],
  exports: [PrismaService],
})
export class PrismaModule {}
