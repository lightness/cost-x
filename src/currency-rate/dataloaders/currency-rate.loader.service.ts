import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { CurrencyRateService } from '../currency-rate.service';
import { GetCurrencyRateInDto } from '../dto';
import { IDataloaderService, LoaderName } from '../../graphql/dataloaders/interfaces';
import { DateService } from '../../date/date.service';
import { GetCurrencyRateArgs } from '../dto/get-currency-rate.args';
import CurrencyRate from '../entities/currency-rate.entity';

@Injectable()
export class CurrencyRateLoaderService implements IDataloaderService<GetCurrencyRateArgs, CurrencyRate, string> {
  constructor(
    private currencyRateService: CurrencyRateService,
    private dateService: DateService,
  ) { }

  get loaderName(): LoaderName {
    return LoaderName.CURRENCY_RATE;
  }

  createDataloader(): DataLoader<GetCurrencyRateInDto, CurrencyRate, string> {
    return new DataLoader<GetCurrencyRateInDto, CurrencyRate, string>(
      this.loaderFn.bind(this),
      { cacheKeyFn: this.cacheFn.bind(this) },
    );
  }

  private async loaderFn(requests: GetCurrencyRateInDto[]): Promise<CurrencyRate[]> {
    return this.currencyRateService.getMany(requests);
  }

  private cacheFn(request: GetCurrencyRateInDto): string {
    const { fromCurrency, toCurrency, date } = request;

    return `${fromCurrency}->${toCurrency}:${this.dateService.getDatePart(date)}`;
  }
}