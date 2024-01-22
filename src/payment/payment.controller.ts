import { Body, Controller, Delete, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { PaymentInDto } from './dto';
import { PaymentService } from './payment.service';

@Controller()
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('items/:itemId/payments')
  async addPayment(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: PaymentInDto,
  ) {
    return this.paymentService.addPayment(itemId, dto);
  }

  @Put('items/:itemId/payments/:paymentId')
  async updatePayment(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @Body() dto: PaymentInDto,
  ) {

  }

  @Delete('items/:itemId/payments/:paymentId')
  async removePayment(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Param('paymentId', ParseIntPipe) paymentId: number,
  ) {

  }
}