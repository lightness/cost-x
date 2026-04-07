import { Controller, Get, Query } from '@nestjs/common';
import { EmailInviteService } from './email-invite.service';

@Controller('email-invite')
export class EmailInviteController {
  constructor(private emailInviteService: EmailInviteService) {}

  @Get('accept')
  acceptEmailInvite(@Query('token') token: string) {
    return this.emailInviteService.acceptEmailInvite(token);
  }
}
