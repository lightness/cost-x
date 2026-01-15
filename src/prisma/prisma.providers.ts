import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

export const providers: Provider[] = [
  {
    provide: PrismaPg,
    useFactory: (configService: ConfigService) => {
      const connectionString = configService.getOrThrow<string>('db.url');

      return new PrismaPg({ connectionString });
    },
    inject: [ConfigService],
  },
];
