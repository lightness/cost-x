import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { defer, lastValueFrom, Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext();

    const operation = ctx.getInfo().operation.operation;

    if (operation !== 'mutation') {
      return next.handle();
    }

    return defer(() =>
      this.prisma.$transaction(async (tx) => {
        gqlContext.tx = tx;

        const result = await lastValueFrom(next.handle());
        return result;
      }),
    );
  }
}
