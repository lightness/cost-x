import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';
import { Currency } from '../../generated/prisma/enums';
import type { DateService } from '../date/date.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { CurrencyRateApiService } from './currency-rate-api.service';
import type { GetCurrencyRateInDto } from './dto';
import type CurrencyRate from './entities/currency-rate.entity';

type DerivativeMap = Map<Currency, Map<string, Decimal>>;

@Injectable()
export class CurrencyRateService {
  constructor(
    private prisma: PrismaService,
    private currencyRateApiService: CurrencyRateApiService,
    private dateService: DateService,
  ) {}

  async get(dto: GetCurrencyRateInDto): Promise<Decimal> {
    const { fromCurrency, toCurrency, date } = dto;

    const [sourceRate, targetRate] = await Promise.all([
      this.findOrPull({ fromCurrency, toCurrency: Currency.BYN, date }),
      this.findOrPull({
        fromCurrency: toCurrency,
        toCurrency: Currency.BYN,
        date,
      }),
    ]);

    return Decimal.div(sourceRate, targetRate);
  }

  async getMany(dtos: GetCurrencyRateInDto[]): Promise<CurrencyRate[]> {
    const derivativeMap = await this.populateDerivativeMap(
      this.getDerivativeMap(dtos),
    );

    return dtos.map((dto) => {
      const { fromCurrency, toCurrency, date } = dto;

      const getRate = () => {
        if (fromCurrency === toCurrency) {
          return new Decimal(1);
        }

        const datePart = this.dateService.toString(date);

        const sourceRate =
          fromCurrency !== Currency.BYN
            ? derivativeMap.get(fromCurrency).get(datePart)
            : new Decimal(1);

        const targetRate =
          toCurrency !== Currency.BYN
            ? derivativeMap.get(toCurrency).get(datePart)
            : new Decimal(1);

        return Decimal.div(sourceRate, targetRate);
      };

      return {
        fromCurrency,
        toCurrency,
        date,
        rate: getRate(),
      } as CurrencyRate;
    });
  }

  private getDerivativeMap(dtos: GetCurrencyRateInDto[]): DerivativeMap {
    return dtos.reduce((acc, cur) => {
      const { fromCurrency, toCurrency, date } = cur;

      if (fromCurrency === toCurrency) {
        return acc;
      }

      const datePart = this.dateService.toString(date);

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
    }, new Map());
  }

  private async populateDerivativeMap(
    derivativeMap: DerivativeMap,
  ): Promise<DerivativeMap> {
    for (const fromCurrency of derivativeMap.keys()) {
      const dates = Array.from(derivativeMap.get(fromCurrency).keys()).map(
        (dateStr) => this.dateService.fromString(dateStr),
      );

      const currencyRates = await this.prisma.currencyRate.findMany({
        where: {
          fromCurrency,
          toCurrency: Currency.BYN,
          date: { in: dates },
        },
        select: {
          rate: true,
          date: true,
        },
      });

      for (const currencyRate of currencyRates) {
        const dateStr = this.dateService.toString(currencyRate.date);

        derivativeMap.get(fromCurrency).set(dateStr, currencyRate.rate);
      }

      for (const [datePart, rate] of derivativeMap
        .get(fromCurrency)
        .entries()) {
        if (!rate) {
          const pulledRate = await this.pullAndSave(fromCurrency, datePart);

          derivativeMap.get(fromCurrency).set(datePart, pulledRate);
        }
      }
    }

    return derivativeMap;
  }

  private async findOrPull(dto: GetCurrencyRateInDto): Promise<Decimal> {
    const { fromCurrency, toCurrency, date } = dto;

    if (toCurrency !== Currency.BYN) {
      throw new InternalServerErrorException(
        `Cannot request currency rate if 'toCurrency' is not BYN`,
      );
    }

    if (fromCurrency === toCurrency) {
      return new Decimal(1);
    }

    const foundCurrencyRate = await this.prisma.currencyRate.findFirst({
      where: {
        fromCurrency,
        toCurrency,
        date,
      },
    });

    if (foundCurrencyRate) {
      return foundCurrencyRate.rate;
    }

    const datePart = this.dateService.toString(date);

    return this.pullAndSave(fromCurrency, datePart);
  }

  private async pullAndSave(fromCurrency: Currency, datePart: string) {
    const rate = await this.currencyRateApiService.pullCurrencyRate(
      fromCurrency,
      datePart,
    );

    const createdCurrencyRate = await this.prisma.currencyRate.create({
      data: {
        fromCurrency,
        toCurrency: Currency.BYN,
        date: new Date(datePart),
        rate,
      },
    });

    return createdCurrencyRate.rate;
  }
}
