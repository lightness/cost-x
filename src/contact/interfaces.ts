export interface EmailInviteJwtPayload {
  id: number;
  inviteId: number;
  inviteeEmail: string;
  confirmEmailTempCode: string;
  resetPasswordTempCode: string;
}
