import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CurrencyRate } from '../database/entities';
import { CurrencyRateController } from './currency-rate.controller';
import { CurrencyRateService } from './currency-rate.service';
import { CurrencyRateApiService } from './currency-rate-api.service';
import { DateModule } from '../date/date.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CurrencyRate]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    DateModule
  ],
  providers: [CurrencyRateService, CurrencyRateApiService],
  controllers: [CurrencyRateController],
  exports: [CurrencyRateService],
})
export class CurrencyRateModule { }