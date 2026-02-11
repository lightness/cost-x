import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable } from 'rxjs';
import { Prisma } from '../../../generated/prisma/client';
import { UniqueConstraintViolationError } from './unique-constraint-violation.error';

@Injectable()
export class DbExceptionInterceptor implements NestInterceptor {
  intercept(
    _: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          this.remapPrismaErrors(error);
        }

        throw error;
      }),
    );
  }

  get regex(): RegExp {
    return /.*Unique constraint failed on the fields: \((.*)\)/;
  }

  remapPrismaErrors(exception: Prisma.PrismaClientKnownRequestError) {
    if (exception.code === 'P2002') {
      const [_, fields] = this.regex.exec(exception.message);
      const cleanFields = fields
        .replace(/`/g, '')
        .split(',')
        .map((field) => field.trim());

      throw new UniqueConstraintViolationError(cleanFields);
    }
  }
}
