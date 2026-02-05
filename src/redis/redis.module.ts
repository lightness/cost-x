import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';

@Module({
  exports: [RedisService],
  imports: [ConfigModule],
  providers: [RedisService],
})
export class RedisModule {}
