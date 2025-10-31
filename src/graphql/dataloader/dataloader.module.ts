import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../../database/entities';
import { DataloaderService } from './dataloader.service';
import { PaymentsByItemIdLoader } from './payments-by-item-id.loader';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  providers: [DataloaderService, PaymentsByItemIdLoader],
  exports: [DataloaderService],
})
export class DataLoaderModule {

}