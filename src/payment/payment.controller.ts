import { Body, Controller, Delete, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { PaymentInDto } from './dto';
import { PaymentService } from './payment.service';
import { ItemByIdPipe } from '../common/pipes/item-by-id.pipe';
import { Item, Payment } from '../database/entities';
import { PaymentByIdPipe } from '../common/pipes/payment-by-id.pipe';

@Controller()
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('items/:itemId/payments')
  async addPayment(
    @Param('itemId', ParseIntPipe, ItemByIdPipe) item: Item,
    @Body() dto: PaymentInDto,
  ) {
    return this.paymentService.addPayment(item, dto);
  }

  @Put('items/:itemId/payments/:paymentId')
  async updatePayment(
    @Param('itemId', ParseIntPipe, ItemByIdPipe) item: Item,
    @Param('paymentId', ParseIntPipe, PaymentByIdPipe) payment: Payment,
    @Body() dto: PaymentInDto,
  ) {
    return this.paymentService.updatePayment(item, payment, dto);
  }

  @Delete('items/:itemId/payments/:paymentId')
  async removePayment(
    @Param('itemId', ParseIntPipe, ItemByIdPipe) item: Item,
    @Param('paymentId', ParseIntPipe, PaymentByIdPipe) payment: Payment,
  ) {
    return this.paymentService.removePayment(item, payment);
  }
}