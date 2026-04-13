import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { INFER_METADATA_KEY, InferEntry } from '../../common/decorator/infer.decorator';
import { ACCESS2_METADATA_KEY, Access2Metadata } from '../decorator/access2.decorator';
import { NoAccessError } from '../error/no-access.error';
import { Access2Service } from '../access2.service';

@Injectable()
export class Access2Guard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private access2Service: Access2Service,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const access2Metadata = this.reflector.getAllAndOverride<Access2Metadata>(
      ACCESS2_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!access2Metadata) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);

    if (!ctx.getContext().req.user) {
      throw new NoAccessError();
    }

    const inferEntries =
      this.reflector.getAllAndOverride<InferEntry[]>(INFER_METADATA_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const { action, ruleDef } = access2Metadata;
    const hasAccess = await this.access2Service.hasAccess(action, ruleDef, inferEntries, ctx);

    if (!hasAccess) {
      throw new NoAccessError();
    }

    return true;
  }
}
