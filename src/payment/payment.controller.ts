import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import type { PaymentInDto } from './dto';
import type { PaymentService } from './payment.service';
import { ItemByIdPipe } from '../common/pipes/item-by-id.pipe';
import { PaymentByIdPipe } from '../common/pipes/payment-by-id.pipe';
import type Item from '../item/entities/item.entity';
import type Payment from './entities/payment.entity';

@Controller()
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Get('items/:itemId/payments/:paymentId')
  async getPayment(
    @Param('itemId', ParseIntPipe, ItemByIdPipe) item: Item,
    @Param('paymentId', ParseIntPipe, PaymentByIdPipe) payment: Payment,
  ) {
    return this.paymentService.getPayment(item, payment);
  }

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
