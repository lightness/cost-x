import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const redisProvider: Provider = {
  provide: Redis,
  useFactory: (configService: ConfigService) => {
    const redisUrl = configService.getOrThrow<string>('redis.url');

    return new Redis(redisUrl);
  },
  inject: [ConfigService]
}