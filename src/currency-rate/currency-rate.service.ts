import { Injectable, Logger } from '@nestjs/common';
import { GetCurrencyRateInDto } from './dto';
import { CurrencyRate } from '../database/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrencyRateApiService } from './currency-rate-api.service';
import { Memo } from '../common/decorators/memo.decorator';

@Injectable()
export class CurrencyRateService {
  private readonly logger = new Logger(CurrencyRateService.name);

  constructor(
    @InjectRepository(CurrencyRate) private currencyRateRepository: Repository<CurrencyRate>,
    private currencyRateApiService: CurrencyRateApiService
  ) { }

  @Memo()
  async get(dto: GetCurrencyRateInDto): Promise<CurrencyRate> {
    const { fromCurrency, toCurrency, date } = dto;

    const existingCurrencyRate = await this.currencyRateRepository.findOneBy({
      fromCurrency,
      toCurrency,
      date,
    });

    if (existingCurrencyRate) {
      return existingCurrencyRate;
    }

    const rate = await this.currencyRateApiService.pullCurrencyRate(fromCurrency, date);

    const createdCurrencyRate = await this.currencyRateRepository.save({
      fromCurrency,
      toCurrency,
      date,
      rate,
    })

    return createdCurrencyRate;
  }
}