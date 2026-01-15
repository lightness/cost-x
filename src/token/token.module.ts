import { type DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';
import { CONFIG } from './symbols';
import { RedisModule } from '../redis/redis.module';

@Module({})
export class TokenModule {
  static register(token: string | symbol, configPath: string): DynamicModule {
    return {
      module: TokenModule,
      imports: [RedisModule],
      providers: [
        {
          provide: CONFIG,
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            return configService.get(configPath);
          },
        },
        {
          provide: token,
          useClass: TokenService,
        },
      ],
      exports: [token],
    };
  }
}
