import { Module } from '@nestjs/common';
import { ItemMergeController } from './item-merge.controller';
import { ItemMergeService } from './item-merge.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ItemMergeService],
  controllers: [ItemMergeController],
})
export class ItemMergeModule {}
