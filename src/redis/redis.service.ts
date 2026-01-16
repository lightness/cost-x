import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor(configService: ConfigService) {
    const redisUrl = configService.getOrThrow<string>('redis.url');

    super(redisUrl);
  }

  onModuleDestroy() {
    this.disconnect();
  }
}
