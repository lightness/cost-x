import { Injectable } from '@nestjs/common';
import { ConfirmEmailService } from '../confirm-email/confirm-email.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForgotPasswordInDto } from '../reset-password/dto';
import { ResetPasswordService } from '../reset-password/reset-password.service';
import { UserStatus } from '../user/entity/user-status.enum';
import { ResendConfirmEmailInDto } from './dto';

@Injectable()
export class ResendEmailService {
  constructor(
    private prisma: PrismaService,
    private resetPasswordService: ResetPasswordService,
    private confirmEmailService: ConfirmEmailService,
  ) {}

  async resendConfirmEmail(dto: ResendConfirmEmailInDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      // Do not reveal existence of user by email
      return { success: true };
    }

    if (user.status !== UserStatus.EMAIL_NOT_VERIFIED) {
      // Do not reveal status of existing user
      return { success: true };
    }

    await this.confirmEmailService.sendConfirmEmail(user);

    return { success: true };
  }

  async resendForgotPasswordEmail(dto: ForgotPasswordInDto) {
    await this.resetPasswordService.sendForgotPasswordEmail(dto, false);

    return { success: true };
  }
}
