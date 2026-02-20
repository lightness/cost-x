import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ApplicationExceptionFilter } from './common/error/application.exception-filter';
import { ValidationError } from './common/error/validation.error';
import { DbExceptionInterceptor } from './prisma/error/db-exception.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  const configService = app.get(ConfigService);
  const port = configService.get('port');

  await app.listen(port);
}
bootstrap();
