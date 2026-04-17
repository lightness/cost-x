import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Context, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Prisma, UserRole } from '../../../generated/prisma/browser';
import { Access } from '../../access/decorator/access.decorator';
import { fromArg } from '../../access/function/from-arg.function';
import { AccessGuard } from '../../access/guard/access.guard';
import { AccessScope } from '../../access/interfaces';
import { Permission } from '../../access/permission.enum';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { Infer } from '../../common/decorator/infer.decorator';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { ContactByIdPipe } from '../../common/pipe/contact-by-id.pipe';
import { SourceUserByContactPipe } from '../../common/pipe/source-user-by-contact.pipe';
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
  @Access.allow({
    or: [
      { and: [{ self: 'sourceUser' }, { scope: AccessScope.USER, permission: Permission.DELETE_CONTACT }] },
      { role: UserRole.ADMIN, scope: AccessScope.USER },
    ],
  })
  @Infer('contact', { from: fromArg('contactId'), pipes: [ContactByIdPipe] })
  @Infer('sourceUser', { from: 'contact', pipes: [SourceUserByContactPipe] })
  async deleteContact(
    @Args('contactId', { type: () => Int }, ContactByIdPipe) contact: Contact,
    @Context('tx') tx: Prisma.TransactionClient,
    @CurrentUser() currentUser: User,
  ) {
    await this.contactValidationService.validateDeleteContact(contact, tx);

    const [removedContact] = await this.contactService.removeContactPair(
      contact,
      currentUser.id,
      tx,
    );

    return removedContact;
  }
}
