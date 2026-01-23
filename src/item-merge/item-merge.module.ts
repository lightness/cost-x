import { Module } from '@nestjs/common';
import { ConsistencyModule } from '../consistency/consistency.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ItemMergeService } from './item-merge.service';
import { ItemMergeResolver } from './resolver/item-merge.resolver';

@Module({
  imports: [PrismaModule, ConsistencyModule],
  providers: [
    ItemMergeService,
    // resolver
    ItemMergeResolver,
  ],
})
export class ItemMergeModule {}
