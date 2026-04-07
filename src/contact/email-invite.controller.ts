import { Controller, Get, Query, Req, UseInterceptors } from '@nestjs/common';
import { Request } from 'express';
import { HttpTransactionInterceptor } from '../common/interceptor/http-transaction.interceptor';
import { EmailInviteService } from './email-invite.service';

@Controller('email-invite')
export class EmailInviteController {
  constructor(private emailInviteService: EmailInviteService) {}

  @UseInterceptors(HttpTransactionInterceptor)
  @Get('accept')
  acceptEmailInvite(@Query('token') token: string, @Req() req: Request) {
    return this.emailInviteService.acceptEmailInvite(token, req['tx']);
  }
}
