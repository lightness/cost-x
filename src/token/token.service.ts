import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import Redis from 'ioredis';
import { decode, sign, verify } from 'jsonwebtoken';
import { ExpiresIn } from './interfaces';
import { CONFIG } from './symbols';

@Injectable()
export class TokenService<T extends object> {
  constructor(
    private redis: Redis,
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
    return sign(payload, this.secret, { expiresIn: this.expiresIn });
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

    await this.redis.set(this.getRedisKey(token), '', 'EX', exp + 1);
  }

  async validateToken(token: string): Promise<void> {
    const count = await this.redis.exists(this.getRedisKey(token));

    if (count > 0) {
      throw new UnauthorizedException(`Not authorized`);
    }
  }

  protected getExp(token: string): number {
    const decoded = decode(token, { json: true });

    return decoded.exp;
  }

  private getRedisKey(token: string): string {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    return `${this.redisPrefix}${tokenHash}`;
  }
}
