import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import config from '../src/app.config';

@Module({
  imports: [ConfigModule.forRoot({ envFilePath: '.env.test', isGlobal: true, load: [config] })],
})
export class TestConfigModule {}
