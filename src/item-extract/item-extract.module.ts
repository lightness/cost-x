import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ItemExtractService } from './item-extract.service';
import { ItemExtractMutationResolver } from './resolver/item-extract.mutation.resolver';

@Module({
  imports: [PrismaModule, AuthModule, AccessModule],
  providers: [
    ItemExtractService,
    // resolver
    ItemExtractMutationResolver,
  ],
})
export class ItemExtractModule {}
