import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '../redis/redis.module';
import { CONFIG } from './symbols';
import { TokenService } from './token.service';

@Module({})
export class TokenModule {
  static register(token: string | symbol, configPath: string): DynamicModule {
    return {
      exports: [token],
      imports: [RedisModule, ConfigModule],
      module: TokenModule,
      providers: [
        {
          inject: [ConfigService],
          provide: CONFIG,
          useFactory: (configService: ConfigService) => {
            return configService.get(configPath);
          },
        },
        {
          provide: token,
          useClass: TokenService,
        },
      ],
    };
  }
}
