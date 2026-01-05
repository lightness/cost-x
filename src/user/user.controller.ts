import { Controller, Get, Query } from '@nestjs/common';
import { ConfirmEmailService } from './confirm-email.service';

@Controller()
export class UserController {
  constructor(private confirmEmailService: ConfirmEmailService) {}

  @Get('user/confirm')
  async confirmEmail(@Query('token') token: string) {
    return this.confirmEmailService.confirmEmail(token);
  }
}