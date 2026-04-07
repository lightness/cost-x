import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
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
import {
  EmailInviteNoLongerValidError,
  EmailInviteTokenInvalidError,
  InviteeBlockedInviterError,
  InviterAlreadySendInviteError,
  InviterBlockedInviteeError,
} from './error';
import { EmailInviteJwtPayload } from './interfaces';
import { InviteValidationService } from './invite-validation.service';
import { InviteService } from './invite.service';
import { EMAIL_INVITE_TOKEN_SERVICE } from './symbols';
import { UserBlockService } from './user-block.service';

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
    private userBlockService: UserBlockService,
  ) {}

  async createInviteByEmail(
    dto: CreateInviteByEmailInDto,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Invite> {
    const { inviterUserId, inviteeEmail } = dto;
    const email = this.normalizeEmail(inviteeEmail.toLowerCase());
    const ghostEmail = this.buildGhostEmail(inviterUserId, email);

    const existingGhost = await tx.user.findUnique({ where: { email: ghostEmail } });

    if (existingGhost) {
      throw new InviterAlreadySendInviteError();
    }

    const realUser = await tx.user.findUnique({ where: { email } });

    if (realUser) {
      const isInviterBlocked = await this.userBlockService.isUserBlockExists(
        inviterUserId,
        realUser.id,
        tx,
      );

      if (isInviterBlocked) {
        throw new InviteeBlockedInviterError();
      }

      const isInviteeBlocked = await this.userBlockService.isUserBlockExists(
        realUser.id,
        inviterUserId,
        tx,
      );

      if (isInviteeBlocked) {
        throw new InviterBlockedInviteeError();
      }
    }

    const inviter = await tx.user.findUnique({ where: { id: inviterUserId } });

    const confirmEmailTempCode = uuid();
    const resetPasswordTempCode = uuid();
    const password = await this.bcryptService.hashPassword(uuid());

    const ghost = await tx.user.create({
      data: {
        confirmEmailTempCode,
        email: ghostEmail,
        name: email.split('@')[0],
        password,
        resetPasswordTempCode,
      },
    });

    const invite = await this.inviteService.createInvite(inviterUserId, ghost.id, tx);

    const token = await this.tokenService.createToken({
      confirmEmailTempCode,
      id: ghost.id,
      inviteeEmail: email,
      inviteId: invite.id,
      resetPasswordTempCode,
    });

    await this.mailService.sendEmailInvite(ghost, inviter, token);

    return invite;
  }

  async acceptEmailInvite(token: string): Promise<{ resetPasswordToken: string }> {
    let payload: EmailInviteJwtPayload;

    try {
      payload = await this.tokenService.verifyToken(token);
    } catch (_e) {
      throw new EmailInviteTokenInvalidError();
    }

    return this.prisma.$transaction(async (tx) => {
      const ghost = await tx.user.findUnique({ where: { id: payload.id } });

      if (!ghost || ghost.confirmEmailTempCode !== payload.confirmEmailTempCode) {
        throw new EmailInviteTokenInvalidError();
      }

      const invite = await tx.invite.findUnique({ where: { id: payload.inviteId } });

      if (!invite || invite.status !== InviteStatus.PENDING) {
        throw new EmailInviteNoLongerValidError();
      }

      const realUser = await tx.user.findUnique({ where: { email: payload.inviteeEmail } });

      if (realUser) {
        await this.inviteValidationService.validateCreateInvite(invite.inviterId, realUser.id, tx);

        await tx.invite.update({
          data: { inviteeId: realUser.id, reactedAt: new Date(), status: InviteStatus.ACCEPTED },
          where: { id: invite.id },
        });

        await this.contactService.createContactPair(invite.inviterId, realUser.id, invite.id, tx);

        await tx.user.update({
          data: { confirmEmailTempCode: null },
          where: { id: ghost.id },
        });

        const resetPasswordToken = await this.resetPasswordService.createTokenFromExistingCode({
          id: realUser.id,
          resetPasswordTempCode: realUser.resetPasswordTempCode,
        });

        return { resetPasswordToken };
      }

      await tx.user.update({
        data: { confirmEmailTempCode: null, email: payload.inviteeEmail },
        where: { id: ghost.id },
      });

      await tx.invite.update({
        data: { reactedAt: new Date(), status: InviteStatus.ACCEPTED },
        where: { id: invite.id },
      });

      await this.contactService.createContactPair(invite.inviterId, ghost.id, invite.id, tx);

      const resetPasswordToken = await this.resetPasswordService.createTokenFromExistingCode({
        id: ghost.id,
        resetPasswordTempCode: payload.resetPasswordTempCode,
      });

      return { resetPasswordToken };
    });
  }

  private normalizeEmail(email: string): string {
    const [local, domain] = email.split('@');

    return `${local.split('+')[0]}@${domain}`;
  }

  private buildGhostEmail(inviterUserId: number, inviteeEmail: string): string {
    const hash = createHash('sha256').update(`${inviterUserId}:${inviteeEmail}`).digest('hex');

    return `${hash}@placeholder.internal`;
  }
}
