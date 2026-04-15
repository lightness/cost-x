import { Injectable } from '@nestjs/common';
import { AccessScope, ResolvedRule } from '../interfaces';
import { AccessStrategy } from './interface';
import { GlobalAccessStrategy } from './global.access-strategy';

@Injectable()
export class UserToWorkspaceAccessStrategy
  extends GlobalAccessStrategy
  implements AccessStrategy
{
  isApplicable(rule: ResolvedRule): boolean {
    return rule.targetScope === AccessScope.WORKSPACE;
  }

  async executeRule(rule: ResolvedRule): Promise<boolean> {
    const userId = (rule.sourceEntity as { id: number }).id;
    const workspace = rule.targetEntity as { ownerId: number };

    if (workspace.ownerId !== userId) {
      return false;
    }

    return super.executeRule(rule);
  }
}
