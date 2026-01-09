import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AccessService } from '../access.service';
import { ACCESS_METADATA_KEY, AccessMetadata } from '../decorator/access.decorator';

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private accessService: AccessService,
  ) {}

  getCtx(context: ExecutionContext): GqlExecutionContext {
    return GqlExecutionContext.create(context);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const accessMetadata = this.reflector.getAllAndOverride<AccessMetadata>(
      ACCESS_METADATA_KEY, 
      [context.getHandler(), context.getClass()],
    );

    // public access
    if (!accessMetadata) {
      return true;
    }

    const ctx = this.getCtx(context);
    const req = ctx.getContext().req;

    if (!req.user) {
      throw this.noAccessException;
    }

    const { ruleDef, action } = accessMetadata;
    const hasAccess = await this.accessService.hasAccess(action, ruleDef, ctx);
    
    if (!hasAccess) {
      throw this.noAccessException;
    }

    return true;
  }

  private get noAccessException() {
    return new ForbiddenException(`No access`);
  }
}