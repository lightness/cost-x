import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { JwtPayload } from 'jsonwebtoken';
import { ExpiresIn } from './interfaces';
import { TokenService } from './token.service';

@Injectable()
export class RefreshTokenService extends TokenService<JwtPayload> {
  constructor(
    private configService: ConfigService,
    redis: Redis,
  ) {
    super(redis);
  }
  
  get secret(): string {
    return this.configService.getOrThrow<string>('authenticate.refresh.jwt.secret');
  }

  get ttl(): ExpiresIn {
    return this.configService.getOrThrow<ExpiresIn>('authenticate.refresh.jwt.expiresIn');
  }

  get redisPrefix(): string {
    return this.configService.getOrThrow<string>('authenticate.refresh.jwt.redisPrefix');
  }
}
