import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { configureApp } from './configure-app';
import { ConfiguredAppModule } from './configured-app.module';

async function bootstrap() {
  const app = await NestFactory.create(ConfiguredAppModule);

  configureApp(app);

  const configService = app.get(ConfigService);
  const port = configService.get('port');

  await app.listen(port);
}
bootstrap();
