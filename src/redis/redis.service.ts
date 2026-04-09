import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { Command } from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly logQuery: boolean;

  constructor(configService: ConfigService) {
    const redisUrl = configService.getOrThrow<string>('redis.url');

    super(redisUrl);

    this.logQuery = configService.get<boolean>('redis.logQuery') || false;
  }

  async sendCommand(command: Command, stream?: Parameters<Redis['sendCommand']>[1]): Promise<unknown> {
    if (this.logQuery) {
      const start = Date.now();
      const result = await super.sendCommand(command, stream);

      this.logger.log(`${command.name.toUpperCase()} ${command.args.join(' ')} => ${Date.now() - start}ms`);

      return result;
    }

    return super.sendCommand(command, stream);
  }

  onModuleDestroy() {
    this.disconnect();
  }
}
