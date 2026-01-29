import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../../token/token.service';
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
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { id: payload.id },
      });

      req.token = token;
      req.user = user;

      return true;
    } catch (_e) {
      throw new UnauthorizedException(`Not authorized`);
    }
  }

  private getToken(req: Request): string {
    return (req.get('authorization') || '').replace('Bearer ', '');
  }
}
