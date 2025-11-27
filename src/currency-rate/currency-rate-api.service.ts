import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { Currency } from '../database/entities/currency.enum';

@Injectable()
export class CurrencyRateApiService {
  private readonly logger = new Logger(CurrencyRateApiService.name);

  constructor(private readonly httpService: HttpService) {}

  async pullCurrencyRate(currency: Currency, date: Date): Promise<number> {
    this.logger.log('🆗', date);

    const [datePart] = date.toISOString().split('T');

    const response = await firstValueFrom(
      this.httpService.get(`https://api.nbrb.by/exrates/rates/${currency}?ondate=${datePart}&parammode=2&periodicity=0`)
    );

    const { Cur_OfficialRate: rate } = response.data;

    this.logger.log(`Pulled ${currency} rate for ${datePart}: ${rate}`);

    return rate;
  }
}