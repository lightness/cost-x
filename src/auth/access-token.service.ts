import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ExpiresIn, JwtPayload } from './interfaces';
import { TokenService } from './token.service';

@Injectable()
export class AccessTokenService extends TokenService<JwtPayload> {
  constructor(
    private configService: ConfigService, 
    redis: Redis,
  ) {
    super(redis);
  }
  
  get secret(): string {
    return this.configService.getOrThrow<string>('authenticate.access.jwt.secret');
  }

  get ttl(): ExpiresIn {
    return this.configService.getOrThrow<ExpiresIn>('authenticate.access.jwt.expiresIn');
  }

  get redisPrefix(): string {
    return this.configService.getOrThrow<string>('authenticate.access.jwt.redisPrefix');
  }
}
