import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Contact } from './entity/contact.entity';
import { ContactStatus } from './entity/invite-status.enum';
import {
  ContactAlreadyExistsError,
  InviteeAlreadySendInviteError,
  InviteeBlockedInviterError,
  InviterAlreadySendInviteError,
  InviterBlockedInviteeError,
  InviteRejectedError,
} from './error';

@Injectable()
export class ContactValidationService {
  validateInviteExistingUser(contact: Contact, reverseContact: Contact): void {
    // no reverse relations
    if (this.hasNoRelation(reverseContact)) {
      // no contact invitation
      if (this.hasNoRelation(contact)) {
        return;
      }

      // invite already exists
      if (this.isPendingInvite(contact)) {
        throw new InviterAlreadySendInviteError();
      }

      // invite already approved
      if (this.isApprovedInvite(contact)) {
        throw new ContactAlreadyExistsError();
      }

      // invite is rejected - allowed to invite again
      if (this.isRejectedInvite(contact)) {
        return;
      }

      // invite is blocked - unable to invite again
      if (this.isBlockedInvite(contact)) {
        throw new InviterBlockedInviteeError();
      }
    }

    // reverse contact invite already exists
    if (this.isPendingInvite(reverseContact)) {
      throw new InviteeAlreadySendInviteError();
    }

    // reverse contact already approved
    if (this.isApprovedInvite(reverseContact)) {
      throw new ContactAlreadyExistsError();
    }

    // reverse contact already rejected
    if (this.isRejectedInvite(reverseContact)) {
      // no contact invitation
      if (this.hasNoRelation(contact)) {
        return;
      }

      // contact already rejected
      if (this.isRejectedInvite(contact)) {
        return;
      }

      throw new InviteRejectedError();
    }

    if (this.isBlockedInvite(reverseContact)) {
      throw new InviteeBlockedInviterError();
    }

    throw new InternalServerErrorException(
      `Unexpected invite state: ${contact.status} - ${reverseContact.status}`,
    );
  }

  validateAcceptInvite(contact: Contact): void {}

  private hasNoRelation(contact: Contact): boolean {
    return !contact;
  }

  private isPendingInvite(contact: Contact): boolean {
    return contact?.status === ContactStatus.PENDING;
  }

  private isApprovedInvite(contact: Contact): boolean {
    return contact?.status === ContactStatus.ACCEPTED;
  }

  private isRejectedInvite(contact: Contact): boolean {
    return contact?.status === ContactStatus.REJECTED;
  }

  private isBlockedInvite(contact: Contact): boolean {
    return contact?.status === ContactStatus.BLOCKED;
  }
}
