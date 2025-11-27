import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'node:path';
import { Item, Payment } from '../database/entities';
import { ItemCostModule } from '../item-cost/default-currency-cost.module';
import { ItemModule } from '../item/item.module';
import { TagModule } from '../tag/tag.module';
import { DataLoaderModule } from './dataloaders/dataloader.module';
import { DataloaderService } from './dataloaders/dataloader.service';
import './register-enums';
import { ConstantsResolver } from './resolvers/constants.resolver';
import { FindItemsAggregatesResolver } from './resolvers/find-items-aggregates.resolver';
import { FindItemsResponseResolver } from './resolvers/find-items-response.resolver';
import { FindPaymentsAggregatesResolver } from './resolvers/find-payments-aggregates.resolver';
import { FindPaymentsResponseResolver } from './resolvers/find-payments-response.resolver';
import { ItemResolver } from './resolvers/item.resolver';
import { PaymentResolver } from './resolvers/payment.resolver';
import { TagResolver } from './resolvers/tag.resolver';
import { DateIsoScalar } from './scalars/date-iso.scalar';
import { DateScalar } from './scalars/date.scalar';
import { PaymentService } from './services/payment.service';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [DataLoaderModule],
      useFactory: (dataLoaderService: DataloaderService) => {
        return {
          graphiql: true,
          autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'),
          context: async () => ({
            loaders: await dataLoaderService.getLoaders(),
          }),
          resolvers: {
            Date: DateScalar,
            DateIso: DateIsoScalar,
          },
        };
      },
      inject: [DataloaderService],
    }),
    TypeOrmModule.forFeature([Item, Payment]),
    ItemCostModule,
    ItemModule,
    TagModule,
  ],
  providers: [
    // service
    PaymentService,
    // resolvers
    ConstantsResolver,
    ItemResolver,
    FindItemsResponseResolver,
    FindItemsAggregatesResolver,
    PaymentResolver,
    FindPaymentsResponseResolver,
    FindPaymentsAggregatesResolver,
    TagResolver,
  ],
})
export class GraphqlModule { }