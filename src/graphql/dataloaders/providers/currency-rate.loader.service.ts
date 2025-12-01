import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { CurrencyRateService } from '../../../currency-rate/currency-rate.service';
import { GetCurrencyRateInDto } from '../../../currency-rate/dto';
import { IDataloaderService, LoaderName } from '../interfaces';
import { DateService } from '../../../date/date.service';

@Injectable()
export class CurrencyRateLoaderService implements IDataloaderService<GetCurrencyRateInDto, number, string> {
  constructor(
    private currencyRateService: CurrencyRateService,
    private dateService: DateService,
  ) { }

  get loaderName(): LoaderName {
    return LoaderName.CURRENCY_RATE;
  }

  createDataloader(): DataLoader<GetCurrencyRateInDto, number, string> {
    return new DataLoader<GetCurrencyRateInDto, number, string>(
      this.loaderFn.bind(this),
      { cacheKeyFn: this.cacheFn.bind(this) },
    );
  }

  private async loaderFn(requests: GetCurrencyRateInDto[]): Promise<number[]> {
    return this.currencyRateService.getMany(requests);
  }

  private cacheFn(request: GetCurrencyRateInDto): string {
    const { fromCurrency, toCurrency, date } = request;

    return `${fromCurrency}->${toCurrency}:${this.dateService.getDatePart(date)}`;
  }
}