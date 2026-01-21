import { Module } from '@nestjs/common';
import { ItemTagModule } from '../item-tag/item-tag.module';
import { TagResolver } from './resolver/tag.resolver';
import { TagService } from './tag.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ItemsAggregationModule } from '../items-aggregation/items-aggregation.module';

@Module({
  imports: [PrismaModule, ItemTagModule, ItemsAggregationModule],
  providers: [
    TagService,
    // resolvers
    TagResolver,
  ],
  exports: [TagService],
})
export class TagModule {}
