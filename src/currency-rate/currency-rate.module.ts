import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DateModule } from '../date/date.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CurrencyRateApiService } from './currency-rate-api.service';
import { CurrencyRateService } from './currency-rate.service';
import { CurrencyRateLoader } from './dataloader/currency-rate.loader.service';
import { CurrencyRateResolver } from './resolver/currency-rate.resolver';

@Module({
  exports: [CurrencyRateService, CurrencyRateLoader],
  imports: [
    PrismaModule,
    HttpModule.register({
      maxRedirects: 5,
      timeout: 5000,
    }),
    DateModule,
  ],
  providers: [
    CurrencyRateService,
    CurrencyRateApiService,
    CurrencyRateResolver,
    CurrencyRateLoader,
  ],
})
export class CurrencyRateModule {}
