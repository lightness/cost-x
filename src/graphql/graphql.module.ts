import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'node:path';
import { ItemCostModule } from '../item-cost/default-currency-cost.module';
import { ItemModule } from '../item/item.module';
import { TagModule } from '../tag/tag.module';
import { DataLoaderModule } from './dataloaders/dataloader.module';
import { DataloaderService } from './dataloaders/dataloader.service';
import { ConstantsResolver } from './resolvers/constants.resolver';
import { DateIsoScalar, DateScalar } from './scalars';

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
    ItemCostModule,
    ItemModule,
    TagModule,
  ],
  providers: [
    ConstantsResolver,
  ],
})
export class GraphqlModule { }