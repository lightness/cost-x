import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyRate } from '../database/entities';
import { DateModule } from '../date/date.module';
import { CurrencyRateApiService } from './currency-rate-api.service';
import { CurrencyRateController } from './currency-rate.controller';
import { CurrencyRateResolver } from './currency-rate.resolver';
import { CurrencyRateService } from './currency-rate.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CurrencyRate]),
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
  ],
  controllers: [CurrencyRateController],
  exports: [CurrencyRateService],
})
export class CurrencyRateModule { }