import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { INFER_METADATA_KEY, InferEntry } from '../../common/decorator/infer.decorator';
import { ACCESS_METADATA_KEY, AccessMetadata } from '../decorator/access.decorator';
import { NoAccessError } from '../error/no-access.error';
import { AccessService } from '../access.service';

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private accessService: AccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const accessMetadata = this.reflector.getAllAndOverride<AccessMetadata>(
      ACCESS_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!accessMetadata) {
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

    const { action, ruleDef } = accessMetadata;
    const hasAccess = await this.accessService.hasAccess(action, ruleDef, inferEntries, ctx);

    if (!hasAccess) {
      throw new NoAccessError();
    }

    return true;
  }
}
