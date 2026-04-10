import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { GroupModule } from '../group/group.module';
import { MailModule } from '../mail/mail.module';
import { PasswordModule } from '../password/password.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ResetPasswordModule } from '../reset-password/reset-password.module';
import { TokenModule } from '../token/token.module';
import { UserLoaderModule } from '../user/user-loader.module';
import { ContactValidationService } from './contact-validation.service';
import { ContactService } from './contact.service';
import { BlockedUsersByUserIdLoader } from './dataloader/blocked-users-by-user-id.loader';
import { ContactsByUserIdLoader } from './dataloader/contacts-by-user-id.loader';
import { IncomingInvitesByUserIdLoader } from './dataloader/incoming-invites-by-user-id.loader';
import { InviteByInviteIdLoader } from './dataloader/invite-by-invite-id.loader';
import { OutgoingInvitesByUserIdLoader } from './dataloader/outgoing-invites-by-user-id.loader';
import { EmailInviteController } from './email-invite.controller';
import { EmailInviteService } from './email-invite.service';
import { InviteValidationService } from './invite-validation.service';
import { InviteService } from './invite.service';
import { ContactFieldsResolver } from './resolver/contact.fields.resolver';
import { ContactMutationResolver } from './resolver/contact.mutation.resolver';
import { InviteFieldsResolver } from './resolver/invite.fields.resolver';
import { InviteMutationResolver } from './resolver/invite.mutation.resolver';
import { UserBlockFieldsResolver } from './resolver/user-block.fields.resolver';
import { UserBlockMutationResolver } from './resolver/user-block.mutation.resolver';
import { EMAIL_INVITE_TOKEN_SERVICE } from './symbols';
import { UserBlockValidationService } from './user-block-validation.service';
import { UserBlockService } from './user-block.service';

@Module({
  controllers: [EmailInviteController],
  exports: [
    ContactService,
    // loader
    IncomingInvitesByUserIdLoader,
    OutgoingInvitesByUserIdLoader,
    ContactsByUserIdLoader,
    BlockedUsersByUserIdLoader,
  ],
  imports: [
    PrismaModule,
    AuthModule,
    AccessModule,
    GroupModule,
    UserLoaderModule,
    MailModule,
    PasswordModule,
    ResetPasswordModule,
    TokenModule.register(EMAIL_INVITE_TOKEN_SERVICE, 'emailInvite.jwt'),
  ],
  providers: [
    ContactValidationService,
    ContactService,
    InviteValidationService,
    InviteService,
    EmailInviteService,
    UserBlockService,
    UserBlockValidationService,
    // resolvers
    InviteFieldsResolver,
    InviteMutationResolver,
    ContactFieldsResolver,
    ContactMutationResolver,
    UserBlockFieldsResolver,
    UserBlockMutationResolver,
    // loader
    IncomingInvitesByUserIdLoader,
    OutgoingInvitesByUserIdLoader,
    ContactsByUserIdLoader,
    InviteByInviteIdLoader,
    BlockedUsersByUserIdLoader,
  ],
})
export class ContactModule {}
