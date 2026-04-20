import { Injectable } from '@nestjs/common';
import { AccessScope, ResolvedRule } from '../interfaces';
import { AccessStrategy } from './interface';

@Injectable()
export class WorkspaceOwnerAccessStrategy implements AccessStrategy {
  isApplicable(rule: ResolvedRule): boolean {
    return rule.scope === AccessScope.WORKSPACE && rule.ownerCheck === true;
  }

  async executeRule(rule: ResolvedRule): Promise<boolean> {
    const currentUser = rule.sourceEntity as { id: number };
    const workspace = rule.targetEntity as { ownerId: number };

    return workspace.ownerId === currentUser.id;
  }
}
