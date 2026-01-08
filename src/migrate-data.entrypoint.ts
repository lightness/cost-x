import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataMigrationService } from './data-migration/data-migration.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const service = app.get(DataMigrationService);

  await service.migrate();
}
bootstrap();
