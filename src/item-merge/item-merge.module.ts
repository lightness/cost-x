import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemMergeController } from './item-merge.controller';
import { ItemMergeService } from './item-merge.service';
import { Item, Payment } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Item, Payment])],
  providers: [ItemMergeService],
  controllers: [ItemMergeController],
})
export class ItemMergeModule {}