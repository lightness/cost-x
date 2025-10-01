import { Controller, Get, Query } from '@nestjs/common';
import { GetCurrencyRateInDto } from './dto';
import { CurrencyRateService } from './currency-rate.service';

@Controller()
export class CurrencyRateController {
  constructor(private currencyRateService: CurrencyRateService) {}

  @Get('currency-rates')
  async get(@Query() dto: GetCurrencyRateInDto) {
    return this.currencyRateService.get(dto);
  }
}