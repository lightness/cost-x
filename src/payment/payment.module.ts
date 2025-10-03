import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item, Payment } from '../database/entities';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({ 
  imports: [TypeOrmModule.forFeature([Payment, Item])],
  providers: [PaymentService],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}