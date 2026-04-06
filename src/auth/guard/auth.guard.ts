import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../../token/token.service';
import { UserNotAuthorizedError } from '../error/user-not-authorized.error';
import { JwtPayload } from '../interfaces';
import { ACCESS_TOKEN_SERVICE } from '../symbols';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(ACCESS_TOKEN_SERVICE)
    private accessTokenService: TokenService<JwtPayload>,
    private prisma: PrismaService,
  ) {}

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);

    return ctx.getContext().req;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = this.getRequest(context);
    const token = this.getToken(req);

    // public access
    if (!token) {
      return true;
    }

    try {
      const payload = await this.accessTokenService.verifyToken(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.id },
      });

      if (!user) {
        throw new UserNotAuthorizedError();
      }

      req.token = token;
      req.user = user;

      return true;
    } catch (_e) {
      throw new UserNotAuthorizedError();
    }
  }

  private getToken(req: Request): string {
    return (req.get('authorization') || '').replace('Bearer ', '');
  }
}
