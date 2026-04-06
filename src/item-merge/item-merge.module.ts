import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { ConsistencyModule } from '../consistency/consistency.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ItemMergeService } from './item-merge.service';
import { ItemMergeMutationResolver } from './resolver/item-merge.mutation.resolver';

@Module({
  imports: [PrismaModule, AuthModule, AccessModule, ConsistencyModule],
  providers: [
    ItemMergeService,
    // resolver
    ItemMergeMutationResolver,
  ],
})
export class ItemMergeModule {}
