import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, tap } from 'rxjs';

@Injectable()
export class GqlLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(GqlLoggingInterceptor.name);

  constructor(private configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = GqlExecutionContext.create(context);
    const info = ctx.getInfo();
    const operationType = info.operation.operation;
    const operationName = info.fieldName;

    const now = Date.now();

    if (this.isTimeLogNeeded) {
      return next.handle().pipe(
        tap(() => {
          const elapsedTime = Date.now() - now;
          this.logger.log(
            `GraphQL ${operationType} "${operationName}" took ${elapsedTime}ms`,
          );
        }),
      );
    } else {
      return next.handle();
    }
  }

  get isTimeLogNeeded() {
    return this.configService.get<boolean>('graphql.logTime') || false;
  }
}
