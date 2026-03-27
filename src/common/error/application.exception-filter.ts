import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { GraphQLError } from 'graphql/error';
import { getHttpCodeFromError } from '../decorator/http-error-code.decorator';
import { ApplicationError } from './application.error';
import { ApplicationErrorCode, CodedApplicationError } from './coded-application.error';
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
    if ((host.getType() as unknown) === 'graphql') {
      return this.catchAsGraphqlError(exception, host);
    } else {
      return this.catchAsHttpError(exception, host);
    }
  }

  private catchAsGraphqlError(exception: ApplicationError, _host: ArgumentsHost) {
    const payload = this.getPayloadByApplicationError(exception);
    const httpCode = this.getHttpCodeByApplicationError(exception);

    throw new GraphQLError(payload.message, {
      extensions: {
        code:
          exception instanceof CodedApplicationError
            ? exception.code
            : ApplicationErrorCode.UNKNOWN,
        details: exception instanceof DetailedApplicationError ? exception.details : undefined,
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

  private getPayloadByApplicationError(exception: ApplicationError): IErrorPayload {
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

  private getHttpCodeByApplicationError(exception: ApplicationError): HttpStatus {
    const httpStatus = getHttpCodeFromError(exception);

    return httpStatus || HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
