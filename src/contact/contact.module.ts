import { forwardRef, Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { GroupModule } from '../group/group.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { ContactValidationService } from './contact-validation.service';
import { ContactService } from './contact.service';
import { ContactsByUserIdLoader } from './dataloader/contact-by-user-id.loader';
import { IncomingInvitesByUserIdLoader } from './dataloader/incoming-invites-by-user-id.loader';
import { InviteByInviteIdLoader } from './dataloader/invite-by-invite-id.loader';
import { OutgoingInvitesByUserIdLoader } from './dataloader/outgoing-invites-by-user-id.loader';
import { InviteValidationService } from './invite-validation.service';
import { InviteService } from './invite.service';
import { ContactFieldsResolver } from './resolver/contact.fields.resolver';
import { InviteFieldsResolver } from './resolver/invite.fields.resolver';
import { InviteMutationResolver } from './resolver/invite.mutation.resolver';
import { UserBlockService } from './user-block.service';

@Module({
  exports: [
    // loader
    IncomingInvitesByUserIdLoader,
    OutgoingInvitesByUserIdLoader,
    ContactsByUserIdLoader,
  ],
  imports: [PrismaModule, AuthModule, AccessModule, GroupModule, forwardRef(() => UserModule)],
  providers: [
    ContactValidationService,
    ContactService,
    InviteValidationService,
    InviteService,
    UserBlockService,
    // resolvers
    InviteFieldsResolver,
    InviteMutationResolver,
    ContactFieldsResolver,
    // loader
    IncomingInvitesByUserIdLoader,
    OutgoingInvitesByUserIdLoader,
    ContactsByUserIdLoader,
    InviteByInviteIdLoader,
  ],
})
export class ContactModule {}
