import { Controller, Get, Query } from '@nestjs/common';
import type { GetCurrencyRateInDto } from './dto';
import type { CurrencyRateService } from './currency-rate.service';

@Controller()
export class CurrencyRateController {
  constructor(private currencyRateService: CurrencyRateService) {}

  @Get('currency-rates')
  async get(@Query() dto: GetCurrencyRateInDto) {
    return this.currencyRateService.get(dto);
  }
}
