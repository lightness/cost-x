import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../database/entities';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({ 
  imports: [TypeOrmModule.forFeature([Payment])],
  providers: [PaymentService],
  controllers: [PaymentController],
  exports: [],
})
export class PaymentModule {}