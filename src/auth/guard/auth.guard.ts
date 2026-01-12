import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import { AccessTokenService } from '../access-token.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private accessTokenService: AccessTokenService,
    private prisma: PrismaService,
  ) { }

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
      const user = await this.prisma.user.findUniqueOrThrow({ where: { id: payload.id } });

      req.token = token;
      req.user = user;
      
      return true;
    } catch (e) {
      throw new UnauthorizedException(`Not authorized`);
    }

  }

  private getToken(req: Request): string {
    return (req.get('authorization') || '').replace('Bearer ', '');
  }
}