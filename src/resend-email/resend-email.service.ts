import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
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

  async resendConfirmEmail(
    dto: ResendConfirmEmailInDto,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    const user = await tx.user.findUnique({
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

    await this.confirmEmailService.runConfirmationProcess(user, tx);

    return { success: true };
  }

  async resendForgotPasswordEmail(
    dto: ForgotPasswordInDto,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    await this.resetPasswordService.sendForgotPasswordEmail(dto, false, tx);

    return { success: true };
  }
}
