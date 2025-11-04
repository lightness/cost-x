import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'node:path';
import { Item, Payment } from '../database/entities';
import { DefaultCurrencyCostModule } from '../item-cost/default-currency-cost.module';
import { ItemResolver } from './resolver/item.resolver';
import { PaymentResolver } from './resolver/payment.resolver';
import { ConstantsResolver } from './resolver/constants.resolver';
import { DataLoaderModule } from './dataloader/dataloader.module';
import { DataloaderService } from './dataloader/dataloader.service';
import { ItemModule } from '../item/item.module';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [DataLoaderModule],
      useFactory: (dataLoaderService: DataloaderService) => {
        return {
          graphiql: true,
          autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'),
          context: () => ({
            loaders: dataLoaderService.getLoaders(),
          }),
        };
      },
      inject: [DataloaderService],
    }),
    TypeOrmModule.forFeature([Item, Payment]),
    DefaultCurrencyCostModule,
    ItemModule,
  ],
  providers: [
    ItemResolver,
    PaymentResolver,
    ConstantsResolver,
  ],
})
export class GraphqlModule { }