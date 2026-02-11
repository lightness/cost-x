import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { Response } from 'express';
import { ApplicationError } from './application-error';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from './coded-application-error';

interface IErrorPayload {
  error: string;
  message: string;
  status: string;
  code?: ApplicationErrorCode;
}

@Catch(ApplicationError)
export class ApplicationExceptionFilter implements ExceptionFilter {
  catch(exception: ApplicationError, host: ArgumentsHost) {
    if ((host.getType() as unknown) === 'graphql') {
      return this.catchAsGraphqlError(exception, host);
    } else {
      return this.catchAsHttpError(exception, host);
    }
  }

  private catchAsGraphqlError(
    exception: ApplicationError,
    host: ArgumentsHost,
  ) {
    const gqlHost = GqlArgumentsHost.create(host);
    const ctx = gqlHost.getContext();
    const response = ctx.req.res;

    const payload = this.getPayloadByApplicationError(exception);

    response.status(HttpStatus.OK).json({
      data: null,
      errors: [payload],
    });
  }

  private catchAsHttpError(exception: ApplicationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = this.getHttpCodeByApplicationError(exception);
    const payload = this.getPayloadByApplicationError(exception);

    response.status(status).json(payload);
  }

  private getPayloadByApplicationError(exception: ApplicationError): unknown {
    const payload: IErrorPayload = {
      error: exception.constructor.name,
      message: exception.message,
      status: HttpStatus[this.getHttpCodeByApplicationError(exception)],
    };

    if (exception instanceof CodedApplicationError) {
      payload.code = exception.code;
    }

    return payload;
  }

  private getHttpCodeByApplicationError(
    exception: ApplicationError,
  ): HttpStatus {
    if (!(exception instanceof CodedApplicationError)) {
      return HttpStatus.BAD_REQUEST;
    }

    switch (exception.code) {
      case ApplicationErrorCode.EMAIL_IS_NOT_VERIFIED:
      case ApplicationErrorCode.INVALID_CREDENTIALS:
      case ApplicationErrorCode.UNKNOWN_USER:
      case ApplicationErrorCode.USER_BANNED:
        return HttpStatus.UNAUTHORIZED;
      case ApplicationErrorCode.UNIQUE_CONSTRAINT_VIOLATION:
        return HttpStatus.BAD_REQUEST;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}
