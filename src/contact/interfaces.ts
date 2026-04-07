export interface EmailInviteJwtPayload {
  id: number;
  inviteId: number;
  confirmEmailTempCode: string;
  resetPasswordTempCode: string;
}
