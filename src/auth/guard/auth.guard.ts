import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService) { }

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

    const user = await this.authService.verifyAccessToken(token);
    req.user = user;

    return true;
  }

  private getToken(req: Request): string {
    return (req.get('authorization') || '').replace('Bearer ', '');
  }
}