import { Injectable } from '@nestjs/common';
import { IDataloaders } from './interfaces';
import { PaymentsByItemIdLoader } from './payments-by-item-id.loader';

@Injectable()
export class DataloaderService {
  constructor(private paymentsByItemIdLoader: PaymentsByItemIdLoader) {}

  getLoaders(): IDataloaders {
    return {
      paymentsByItemIdLoader: this.paymentsByItemIdLoader.createLoader(),
    };
  }
}