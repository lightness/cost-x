import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Prisma } from '../../generated/prisma/client';
import { MailService } from '../mail/mail.service';
import { BcryptService } from '../password/bcrypt.service';
import { PrismaService } from '../prisma/prisma.service';
import { ResetPasswordService } from '../reset-password/reset-password.service';
import { TokenService } from '../token/token.service';
import { ContactService } from './contact.service';
import { CreateInviteByEmailInDto } from './dto';
import { InviteStatus } from './entity/invite-status.enum';
import { Invite } from './entity/invite.entity';
import { EmailInviteJwtPayload } from './interfaces';
import { InviteValidationService } from './invite-validation.service';
import { InviteService } from './invite.service';
import { EMAIL_INVITE_TOKEN_SERVICE } from './symbols';

@Injectable()
export class EmailInviteService {
  constructor(
    @Inject(EMAIL_INVITE_TOKEN_SERVICE)
    private tokenService: TokenService<EmailInviteJwtPayload>,
    private prisma: PrismaService,
    private bcryptService: BcryptService,
    private mailService: MailService,
    private inviteService: InviteService,
    private inviteValidationService: InviteValidationService,
    private contactService: ContactService,
    private resetPasswordService: ResetPasswordService,
  ) {}

  async createInviteByEmail(
    dto: CreateInviteByEmailInDto,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Invite> {
    const { inviterUserId, inviteeEmail } = dto;
    const email = inviteeEmail.toLowerCase();

    const existingUser = await tx.user.findUnique({ where: { email } });

    if (existingUser) {
      await this.inviteValidationService.validateCreateInvite(inviterUserId, existingUser.id, tx);

      return this.inviteService.createInvite(inviterUserId, existingUser.id, tx);
    }

    const inviter = await tx.user.findUnique({ where: { id: inviterUserId } });

    const name = email.split('@')[0];
    const password = await this.bcryptService.hashPassword(uuid());
    const confirmEmailTempCode = uuid();
    const resetPasswordTempCode = uuid();

    const invitee = await tx.user.create({
      data: {
        confirmEmailTempCode,
        email,
        name,
        password,
        resetPasswordTempCode,
      },
    });

    const invite = await this.inviteService.createInvite(inviterUserId, invitee.id, tx);

    const token = await this.tokenService.createToken({
      confirmEmailTempCode,
      id: invitee.id,
      inviteId: invite.id,
      resetPasswordTempCode,
    });

    await this.mailService.sendEmailInvite(invitee, inviter, token);

    return invite;
  }

  async acceptEmailInvite(token: string): Promise<{ resetPasswordToken: string }> {
    let payload: EmailInviteJwtPayload;

    try {
      payload = await this.tokenService.verifyToken(token);
    } catch (_e) {
      throw new BadRequestException('Token is invalid');
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: payload.id } });

      if (!user || user.confirmEmailTempCode !== payload.confirmEmailTempCode) {
        throw new BadRequestException('Token is invalid');
      }

      const invite = await tx.invite.findUnique({ where: { id: payload.inviteId } });

      if (!invite || invite.status !== InviteStatus.PENDING) {
        throw new BadRequestException('Invite is no longer valid');
      }

      await tx.user.update({
        data: { confirmEmailTempCode: null },
        where: { id: user.id },
      });

      await tx.invite.update({
        data: { reactedAt: new Date(), status: InviteStatus.ACCEPTED },
        where: { id: invite.id },
      });

      await this.contactService.createContactPair(
        invite.inviterId,
        invite.inviteeId,
        invite.id,
        tx,
      );

      const resetPasswordToken = await this.resetPasswordService.createTokenFromExistingCode({
        id: user.id,
        resetPasswordTempCode: payload.resetPasswordTempCode,
      });

      return { resetPasswordToken };
    });
  }
}
