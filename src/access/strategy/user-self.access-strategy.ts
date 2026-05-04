import { Injectable } from '@nestjs/common';
import { AccessScope, ResolvedRule } from '../interfaces';
import { AccessStrategy } from './interface';

@Injectable()
export class UserSelfAccessStrategy implements AccessStrategy {
  isApplicable(rule: ResolvedRule): boolean {
    return rule.scope === AccessScope.USER && rule.self === true;
  }

  async executeRule(rule: ResolvedRule): Promise<boolean> {
    const sourceUser = rule.sourceEntity as { id: number };
    const targetEntity = rule.targetEntity as { id: number };

    return sourceUser.id === targetEntity.id;
  }
}
