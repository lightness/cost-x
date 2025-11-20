import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'node:path';
import { Item, Payment } from '../database/entities';
import { DefaultCurrencyCostModule } from '../item-cost/default-currency-cost.module';
import { ItemModule } from '../item/item.module';
import { DataLoaderModule } from './dataloader/dataloader.module';
import { DataloaderService } from './dataloader/dataloader.service';
import { ConstantsResolver } from './resolver/constants.resolver';
import { ItemResolver } from './resolver/item.resolver';
import { PaymentResolver } from './resolver/payment.resolver';
import { TagResolver } from './resolver/tag.resolver';
import { TagModule } from '../tag/tag.module';
import { FindItemsResponseResolver } from './resolver/find-items-response.resolver';
import { FindItemsAggregatesResolver } from './resolver/find-items-aggregates.resolver';

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
    TagModule,
  ],
  providers: [
    ConstantsResolver,
    ItemResolver,
    FindItemsResponseResolver,
    FindItemsAggregatesResolver,
    PaymentResolver,
    TagResolver,
  ],
})
export class GraphqlModule { }