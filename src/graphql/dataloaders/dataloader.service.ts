import { Injectable } from '@nestjs/common';
import { IDataloaders, IDataloaderService } from './interfaces';
import { ItemsByTagIdLoaderService, PaymentsByItemIdLoaderService, TagsByItemIdLoaderService } from './providers';

@Injectable()
export class DataloaderService {
  constructor(
    private paymentsByItemIdLoaderService: PaymentsByItemIdLoaderService,
    private itemsByTagIdLoaderService: ItemsByTagIdLoaderService,
    private tagsByItemIdLoaderService: TagsByItemIdLoaderService,
  ) {}

  private get loaderServices() {
    return [
      this.tagsByItemIdLoaderService,
      this.itemsByTagIdLoaderService,
      this.paymentsByItemIdLoaderService,
    ]
  }

  getLoaders(): IDataloaders {
    return this.loaderServices.reduce(
      (loaders, loaderService: IDataloaderService<number, unknown>) => {
        return {
          ...loaders,
          [loaderService.loaderName]: loaderService.createDataloader(loaders),
        }
      }, 
      {} as IDataloaders,
    );
  }
}