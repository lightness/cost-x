import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import config from './app.config';
import { AppModule } from './app.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, load: [config] }), AppModule],
})
export class ConfiguredAppModule {}
