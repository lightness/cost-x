import { ApplicationError } from './application.error';

export enum ApplicationErrorCode {
  EMAIL_IS_NOT_VERIFIED = 'email_is_not_verified',
  USER_BANNED = 'user_banned',
  USER_ALREADY_EXISTS = 'user_already_exists',
  INVALID_CREDENTIALS = 'invalid_credentials',
  INVALID_REFRESH_TOKEN = 'invalid_refresh_token',
  UNKNOWN_USER = 'unknown_user',
  UNIQUE_CONSTRAINT_VIOLATION = 'unique_constraint_violation',
  UNKNOWN = 'unknown',
  VALIDATION = 'validation',
  // contact
  INVITEE_ALREADY_SEND_INVITE = 'invitee_already_send_invite',
  INVITER_ALREADY_SEND_INVITE = 'inviter_already_send_invite',
  INVITEE_BLOCKED_INVITER = 'invitee_blocked_inviter',
  INVITER_BLOCKED_INVITEE = 'inviter_blocked_invitee',
  CONTACT_ALREADY_EXISTS = 'contact_already_exists',
  CONTACT_ALREADY_REMOVED = 'contact_already_removed',
  CONTACT_NOT_FOUND = 'contact_not_found',
  UNEXPECTED_CONTACT_STATE = 'unexpected_contact_state',
  IMPROPER_INVITE_STATUS = 'improper_invite_status',
  INVITE_NOT_FOUND = 'invite_not_found',
  SELF_BLOCK_FORBIDDEN = 'self_block_forbidden',
  BLOCKED_USER_NOT_FOUND = 'blocked_user_not_found',
  //
}

export class CodedApplicationError extends ApplicationError {
  public readonly code: ApplicationErrorCode;

  constructor(code: ApplicationErrorCode, message: string) {
    super(message);
    this.name = 'CodedApplicationError';
    this.code = code;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CodedApplicationError);
    }
  }
}
