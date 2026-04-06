import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import config from '../src/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env.test', isGlobal: true, load: [config] }),
    EventEmitterModule.forRoot(),
  ],
})
export class TestConfigModule {}
