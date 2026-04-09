import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma } from '../../../generated/prisma/browser';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope, Permission, PermissionLevel } from '../../access/interfaces';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { GqlLoggingInterceptor } from '../../graphql/interceptor/gql-logging.interceptor';
import User from '../../user/entity/user.entity';
import { ContactValidationService } from '../contact-validation.service';
import { ContactService } from '../contact.service';
import { Contact } from '../entity/contact.entity';

@Resolver()
@UseInterceptors(GqlLoggingInterceptor, TransactionInterceptor)
@UseGuards(AuthGuard, AccessGuard)
export class ContactMutationResolver {
  constructor(
    private contactService: ContactService,
    private contactValidationService: ContactValidationService,
  ) {}

  @Mutation(() => Contact)
  @Access.allow([
    {
      and: [
        {
          metadata: { as: 'source-user' },
          targetId: fromArg('contactId'),
          targetScope: AccessScope.CONTACT,
        },
        { level: PermissionLevel.OWNER, permission: Permission.CONTACT_DELETE },
      ],
    },
    { level: PermissionLevel.ADMIN, permission: Permission.CONTACT_DELETE },
  ])
  async deleteContact(
    @Args('contactId', { type: () => Int }) contactId: number,
    @Context('tx') tx: Prisma.TransactionClient,
    @CurrentUser() currentUser: User,
  ) {
    await this.contactValidationService.validateDeleteContact(contactId, tx);

    const [contact] = await this.contactService.removeContactPair(contactId, currentUser.id, tx);

    return contact;
  }
}
