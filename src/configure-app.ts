import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

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
      transform: true,
      // exceptionFactory: (validationErrors: ValidationError[] = []) => {
      //   return new BadRequestException(validationErrors);
      // },
    }),
  );
};
