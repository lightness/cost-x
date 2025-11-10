import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemTag, Payment } from '../../database/entities';
import { DataloaderService } from './dataloader.service';
import { PaymentsByItemIdLoader } from './payments-by-item-id.loader';
import { TagsByItemIdLoader } from './tags-by-item-id.loader';
import { ItemsByTagIdLoader } from './items-by-tag-id.loader';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, ItemTag])],
  providers: [
    DataloaderService, 
    PaymentsByItemIdLoader, 
    TagsByItemIdLoader,
    ItemsByTagIdLoader,
  ],
  exports: [DataloaderService],
})
export class DataLoaderModule {}
