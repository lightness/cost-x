import { Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Rule } from './interfaces';
import { FormalAccessStrategy, GlobalAccessStrategy, UserToWorkspaceAccessStrategy } from './strategy';

@Injectable()
export class RuleEngineService {
  constructor(
    private globalAccessStrategy: GlobalAccessStrategy,
    private formalAccessStrategy: FormalAccessStrategy,
    private userToWorkspaceAccessStrategy: UserToWorkspaceAccessStrategy,
  ) {}

  private get strategies() {
    return [
      this.globalAccessStrategy,
      this.formalAccessStrategy,
      this.userToWorkspaceAccessStrategy,
    ];
  }

  async executeRule(rule: Rule, ctx: GqlExecutionContext): Promise<boolean> {
    const strategy = this.strategies.find((strategy) => strategy.isApplicable(rule));

    return strategy.executeRule(rule, ctx);
  }
}