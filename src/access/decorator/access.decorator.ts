import { SetMetadata } from '@nestjs/common';
import { AccessAction, RuleDef } from '../interfaces';

export const ACCESS_METADATA_KEY = 'access';

export interface AccessMetadata {
  action: AccessAction;
  ruleDef: RuleDef;
}

const allow = (ruleDef: RuleDef) =>
  SetMetadata(ACCESS_METADATA_KEY, { action: AccessAction.ALLOW, ruleDef });

const deny = (ruleDef: RuleDef) =>
  SetMetadata(ACCESS_METADATA_KEY, { action: AccessAction.DENY, ruleDef });

export const Access = {
  allow,
  deny,
};
