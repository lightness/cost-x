import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { decode, sign, verify } from 'jsonwebtoken';
import * as crypto from 'node:crypto';
import { RedisService } from '../redis/redis.service';
import { ExpiresIn } from './interfaces';
import { CONFIG } from './symbols';

@Injectable()
export class TokenService<T extends object> {
  constructor(
    private redis: RedisService,
    @Inject(CONFIG) private config,
  ) {}

  get secret(): string {
    return this.config.secret;
  }

  get expiresIn(): ExpiresIn {
    return this.config.expiresIn;
  }

  get redisPrefix(): string {
    return this.config.redisPrefix;
  }

  async createToken(payload: T): Promise<string> {
    // Salt is needed to make different tokens even if called at same second
    const saltedPayload = { ...payload, salt: Math.random() };

    return sign(saltedPayload, this.secret, {
      expiresIn: this.expiresIn,
    });
  }

  decodeToken(token: string): T {
    const decoded = decode(token, { json: true });

    return decoded as T;
  }

  getIat(token: string): number {
    const decoded = decode(token, { json: true });

    return decoded.iat;
  }

  async verifyToken(token: string): Promise<T> {
    const content = await new Promise<T>((resolve, reject) => {
      return verify(token, this.secret, (error, value: T) => {
        if (error) {
          reject(error);
        } else {
          resolve(value);
        }
      });
    });

    await this.validateToken(token);

    return content;
  }

  async invalidateToken(token: string): Promise<void> {
    const exp = this.getExp(token);
    const expiresInSeconds = exp - Math.floor(Date.now() / 1000) + 1;

    if (expiresInSeconds > 0) {
      await this.redis.set(
        this.getRedisKey(token),
        '',
        'EX',
        expiresInSeconds,
        'NX',
      );
    }
  }

  async validateToken(token: string): Promise<void> {
    const count = await this.redis.exists(this.getRedisKey(token));

    if (count > 0) {
      throw new UnauthorizedException(`Not authorized (invalidated)`);
    }
  }

  getExp(token: string): number {
    const decoded = decode(token, { json: true });

    return decoded.exp;
  }

  private getRedisKey(token: string): string {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    return `${this.redisPrefix}${tokenHash}`;
  }
}
