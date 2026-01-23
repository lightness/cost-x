import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { providers } from './prisma.providers';
import { PrismaService } from './prisma.service';

@Module({
  exports: [PrismaService],
  imports: [ConfigModule],
  providers: [PrismaService, ...providers],
})
export class PrismaModule {}
