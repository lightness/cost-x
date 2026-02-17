import { Controller, Get, Query } from '@nestjs/common';
import { ManualConfirmEmailService } from './manual-confirm-email.service';

@Controller()
export class ManualConfirmEmailController {
  constructor(private manualConfirmEmailService: ManualConfirmEmailService) {}

  @Get('confirm-email')
  async confirmEmail(@Query('token') token: string) {
    return this.manualConfirmEmailService.confirmEmail(token);
  }
}
