import { Controller, Get, Query } from '@nestjs/common';
import type { ConfirmEmailService } from './confirm-email.service';

@Controller()
export class ConfirmEmailController {
  constructor(private confirmEmailService: ConfirmEmailService) {}

  @Get('confirm-email')
  async confirmEmail(@Query('token') token: string) {
    return this.confirmEmailService.confirmEmail(token);
  }
}
