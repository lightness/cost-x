import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessService } from '../access.service';
import { ACCESS_METADATA_KEY, AccessMetadata } from '../decorator/access.decorator';
import { NoAccessError } from '../error/no-access.error';

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private accessService: AccessService,
    private prisma: PrismaService,
  ) {}

  getCtx(context: ExecutionContext): GqlExecutionContext {
    return GqlExecutionContext.create(context);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const accessMetadata = this.reflector.getAllAndOverride<AccessMetadata>(ACCESS_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // public access
    if (!accessMetadata) {
      return true;
    }

    const ctx = this.getCtx(context);
    const req = ctx.getContext().req;

    if (!req.user) {
      throw new NoAccessError();
    }

    req.user.permissions = await this.prisma.userPermission.findMany({
      where: { userId: req.user.id },
    });

    const { ruleDef, action } = accessMetadata;
    const hasAccess = await this.accessService.hasAccess(action, ruleDef, ctx);

    if (!hasAccess) {
      throw new NoAccessError();
    }

    return true;
  }
}
