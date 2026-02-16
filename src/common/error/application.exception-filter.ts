import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { GraphQLError } from 'graphql/error';
import { ApplicationError } from './application.error';
import {
  ApplicationErrorCode,
  CodedApplicationError,
} from './coded-application.error';
import { DetailedApplicationError } from './detailed-application.error';

interface IErrorPayload {
  error: string;
  message: string;
  status: string;
  code?: ApplicationErrorCode;
  details?: unknown;
}

@Catch(ApplicationError)
export class ApplicationExceptionFilter implements ExceptionFilter {
  catch(exception: ApplicationError, host: ArgumentsHost) {
    console.log('>>> exception', exception);

    if ((host.getType() as unknown) === 'graphql') {
      return this.catchAsGraphqlError(exception, host);
    } else {
      return this.catchAsHttpError(exception, host);
    }
  }

  private catchAsGraphqlError(
    exception: ApplicationError,
    _host: ArgumentsHost,
  ) {
    const payload = this.getPayloadByApplicationError(exception);
    const httpCode = this.getHttpCodeByApplicationError(exception);

    throw new GraphQLError(payload.message, {
      extensions: {
        code:
          exception instanceof CodedApplicationError
            ? exception.code
            : ApplicationErrorCode.UNKNOWN,
        details:
          exception instanceof DetailedApplicationError
            ? exception.details
            : undefined,
        error: payload.error,
        status: payload.status,
        statusCode: httpCode,
      },
    });
  }

  private catchAsHttpError(exception: ApplicationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const httpCode = this.getHttpCodeByApplicationError(exception);
    const payload = this.getPayloadByApplicationError(exception);

    response.status(httpCode).json(payload);
  }

  private getPayloadByApplicationError(
    exception: ApplicationError,
  ): IErrorPayload {
    const payload: IErrorPayload = {
      error: exception.constructor.name,
      message: exception.message,
      status: HttpStatus[this.getHttpCodeByApplicationError(exception)],
    };

    if (exception instanceof CodedApplicationError) {
      payload.code = exception.code;
    }

    if (exception instanceof DetailedApplicationError) {
      payload.details = exception.details;
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
      case ApplicationErrorCode.INVALID_REFRESH_TOKEN:
      case ApplicationErrorCode.UNKNOWN_USER:
      case ApplicationErrorCode.USER_BANNED:
        return HttpStatus.UNAUTHORIZED;
      case ApplicationErrorCode.UNIQUE_CONSTRAINT_VIOLATION:
      case ApplicationErrorCode.USER_ALREADY_EXISTS:
      case ApplicationErrorCode.VALIDATION:
        return HttpStatus.BAD_REQUEST;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}
