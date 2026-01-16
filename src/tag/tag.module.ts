import { Module } from '@nestjs/common';
import { ItemTagModule } from '../item-tag/item-tag.module';
import { TagController } from './tag.controller';
import { TagResolver } from './tag.resolver';
import { TagService } from './tag.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ItemTagModule],
  providers: [
    TagService,
    // resolvers
    TagResolver,
  ],
  controllers: [TagController],
  exports: [TagService],
})
export class TagModule {}
