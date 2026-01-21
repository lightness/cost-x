import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaClientOptions } from '../../generated/prisma/internal/prismaNamespace';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(
    adapter: PrismaPg,
    configService: ConfigService,
  ) {
    const needLogQuery = configService.get<boolean>('db.logQuery') || false;

    const options: PrismaClientOptions = { adapter };

    if (needLogQuery) {
      options.log = [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'stdout',
          level: 'error',
        },
        {
          emit: 'stdout',
          level: 'info',
        },
        {
          emit: 'stdout',
          level: 'warn',
        },
      ];
    }

    super(options);

    if (needLogQuery) {
      this.$on('query', (event) => {
        this.logger.log(
          `${event.query}, PARAMS: ${event.params} => ${event.duration}ms`,
        );
      });
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
