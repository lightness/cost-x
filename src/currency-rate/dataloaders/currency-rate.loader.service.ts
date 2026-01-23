import { Injectable, Scope } from '@nestjs/common';
import { DateService } from '../../date/date.service';
import { BaseLoader } from '../../graphql/dataloaders/base.loader';
import { CurrencyRateService } from '../currency-rate.service';
import { GetCurrencyRateInDto } from '../dto';
import CurrencyRate from '../entities/currency-rate.entity';

@Injectable({ scope: Scope.REQUEST })
export class CurrencyRateLoader extends BaseLoader<
  GetCurrencyRateInDto,
  CurrencyRate,
  string
> {
  constructor(
    private currencyRateService: CurrencyRateService,
    private dateService: DateService,
  ) {
    super();
  }

  protected async loaderFn(
    requests: GetCurrencyRateInDto[],
  ): Promise<CurrencyRate[]> {
    return this.currencyRateService.getMany(requests);
  }

  protected cacheFn(request: GetCurrencyRateInDto): string {
    const { fromCurrency, toCurrency, date } = request;

    return `${fromCurrency}->${toCurrency}:${this.dateService.toString(date)}`;
  }
}
