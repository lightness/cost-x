import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { ValidationError } from './common/error/validation.error';
import { DbExceptionInterceptor } from './prisma/error/db-exception.interceptor';
import { ApplicationExceptionFilter } from './common/error/application.exception-filter';

export const configureApp = (app: INestApplication<unknown>) => {
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('etag', false);
  expressApp.set('x-powered-by', false);
  expressApp.use(cookieParser());

  app.enableCors();
  // app.enableCors({
  //   maxAge: 86400,
  //   origin: 'http://127.0.0.1:5173',
  //   credentials: true,
  // });

  app.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages: false,
      exceptionFactory(errors) {
        return new ValidationError(errors);
      },
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new DbExceptionInterceptor());
  app.useGlobalFilters(new ApplicationExceptionFilter());
};
