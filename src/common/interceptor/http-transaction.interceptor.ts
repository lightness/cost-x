import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { defer, lastValueFrom, Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HttpTransactionInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    return defer(() =>
      this.prisma.$transaction(async (tx) => {
        req.tx = tx;

        const result = await lastValueFrom(next.handle());
        return result;
      }),
    );
  }
}
