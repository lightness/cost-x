import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrencyRate } from '../database/entities';
import { Currency } from './entities/currency.enum';
import { DateService } from '../date/date.service';
import { CurrencyRateApiService } from './currency-rate-api.service';
import { GetCurrencyRateInDto } from './dto';

type DerivativeMap = Map<Currency, Map<string, number>>;

@Injectable()
export class CurrencyRateService {
  private readonly logger = new Logger(CurrencyRateService.name);

  constructor(
    @InjectRepository(CurrencyRate) private currencyRateRepository: Repository<CurrencyRate>,
    private currencyRateApiService: CurrencyRateApiService,
    private dateService: DateService,
  ) { }

  async get(dto: GetCurrencyRateInDto): Promise<number> {
    const { fromCurrency, toCurrency, date } = dto;

    const [sourceRate, targetRate] = await Promise.all([
      this.findOrPull({ fromCurrency, toCurrency: Currency.BYN, date }),
      this.findOrPull({ fromCurrency: toCurrency, toCurrency: Currency.BYN, date }),
    ]);

    return sourceRate / targetRate;
  }

  async getMany(dtos: GetCurrencyRateInDto[]): Promise<CurrencyRate[]> {
    const derivativeMap = await this.populateDerivativeMap(
      this.getDerivativeMap(dtos),
    );

    return dtos.map((dto) => {
      const { fromCurrency, toCurrency, date } = dto;

      const getRate = () => {
        if (fromCurrency === toCurrency) {
          return 1;
        }

        const datePart = this.dateService.getDatePart(date);

        const sourceRate = fromCurrency !== Currency.BYN
          ? derivativeMap.get(fromCurrency).get(datePart)
          : 1;

        const targetRate = toCurrency !== Currency.BYN
          ? derivativeMap.get(toCurrency).get(datePart)
          : 1;

        return sourceRate / targetRate;
      }

      return {
        fromCurrency,
        toCurrency,
        date,
        rate: getRate(),
      } as CurrencyRate;
    });
  }

  private getDerivativeMap(dtos: GetCurrencyRateInDto[]): DerivativeMap {
    return dtos.reduce(
      (acc, cur) => {
        const { fromCurrency, toCurrency, date } = cur;

        if (fromCurrency === toCurrency) {
          return acc;
        }

        const datePart = this.dateService.getDatePart(date);

        if (fromCurrency !== Currency.BYN) {
          if (!acc.has(fromCurrency)) {
            acc.set(fromCurrency, new Map<string, number>());
          }

          acc.get(fromCurrency).set(datePart, null);
        }

        if (toCurrency !== Currency.BYN) {
          if (!acc.has(toCurrency)) {
            acc.set(toCurrency, new Map<string, number>());
          }

          acc.get(toCurrency).set(datePart, null);
        }

        return acc;
      },
      new Map(),
    );
  }

  private async populateDerivativeMap(derivativeMap: DerivativeMap): Promise<DerivativeMap> {
    for (const fromCurrency of derivativeMap.keys()) {
      const dates = Array.from(derivativeMap.get(fromCurrency).keys());

      const currencyRates = await this.currencyRateRepository
        .createQueryBuilder('cr')
        .where('cr.fromCurrency = :fromCurrency', { fromCurrency })
        .andWhere('cr.toCurrency = :toCurrency', { toCurrency: Currency.BYN })
        .andWhere('cr.date IN (:...dates)', { dates })
        .select('cr.rate', 'rate')
        .addSelect(`TO_CHAR(cr.date, 'YYYY-MM-DD')`, 'date')
        .getRawMany()

      for (const currencyRate of currencyRates) {
        derivativeMap.get(fromCurrency).set(currencyRate.date, Number(currencyRate.rate));
      }

      for (const [datePart, rate] of derivativeMap.get(fromCurrency).entries()) {
        if (!rate) {
          const pulledRate = await this.pullAndSave(fromCurrency, datePart);

          derivativeMap.get(fromCurrency).set(datePart, pulledRate);
        }
      }
    }

    return derivativeMap;
  }

  private async findOrPull(dto: GetCurrencyRateInDto): Promise<number> {
    const { fromCurrency, toCurrency, date } = dto;

    if (toCurrency !== Currency.BYN) {
      throw new InternalServerErrorException(`Cannot request currency rate if 'toCurrency' is not BYN`);
    }

    if (fromCurrency === toCurrency) {
      return 1;
    }

    const foundCurrencyRate = await this.currencyRateRepository.findOneBy({
      fromCurrency,
      toCurrency,
      date,
    });

    if (foundCurrencyRate) {
      return foundCurrencyRate.rate;
    }

    const datePart = this.dateService.getDatePart(date);

    return this.pullAndSave(fromCurrency, datePart);
  }

  private async pullAndSave(fromCurrency: Currency, datePart: string) {
    const rate = await this.currencyRateApiService.pullCurrencyRate(fromCurrency, datePart);

    const createdCurrencyRate = await this.currencyRateRepository.save({
      fromCurrency,
      toCurrency: Currency.BYN,
      date: new Date(datePart),
      rate,
    });

    return createdCurrencyRate.rate;
  }
}