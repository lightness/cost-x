import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DateModule } from '../date/date.module';
import { CurrencyRateApiService } from './currency-rate-api.service';
import { CurrencyRateController } from './currency-rate.controller';
import { CurrencyRateResolver } from './currency-rate.resolver';
import { CurrencyRateService } from './currency-rate.service';
import { CurrencyRateLoader } from './dataloaders/currency-rate.loader.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    DateModule
  ],
  providers: [
    CurrencyRateService, 
    CurrencyRateApiService,
    CurrencyRateResolver,
    CurrencyRateLoader,
  ],
  controllers: [CurrencyRateController],
  exports: [CurrencyRateService, CurrencyRateLoader],
})
export class CurrencyRateModule { }