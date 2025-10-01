import { Injectable, Logger } from '@nestjs/common';
import { Currency } from '../database/entities/currency.enum';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CurrencyRateApiService {
  private readonly logger = new Logger(CurrencyRateApiService.name);

  constructor(private readonly httpService: HttpService) {}

  async pullCurrencyRate(currency: Currency, date: string): Promise<number> {
    const response = await firstValueFrom(
      this.httpService.get(`https://api.nbrb.by/exrates/rates/${currency}?ondate=${date}&parammode=2&periodicity=0`)
    );

    const { Cur_OfficialRate: rate } = response.data;

    this.logger.log(`Pulled ${currency} rate for ${date}: ${rate}`);

    return rate;
  }
}