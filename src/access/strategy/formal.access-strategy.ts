import { Injectable } from '@nestjs/common';
import { AccessScope, ResolvedRule } from '../interfaces';
import { GlobalAccessStrategy } from './global.access-strategy';
import { AccessStrategy } from './interface';

@Injectable()
export class FormalAccessStrategy extends GlobalAccessStrategy implements AccessStrategy {
  isApplicable(rule: ResolvedRule): boolean {
    return rule.targetScope === AccessScope.USER;
  }

  async executeRule(rule: ResolvedRule): Promise<boolean> {
    const sourceEntity = rule.sourceEntity as { id: number };
    const targetEntity = rule.targetEntity as { id: number };

    if (sourceEntity.id !== targetEntity.id) {
      return false;
    }

    return super.executeRule(rule);
  }
}
