import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'node:path';
import { ItemCostModule } from '../item-cost/default-currency-cost.module';
import { ConstantsResolver } from './resolvers/constants.resolver';
import { DateIsoScalar, DateScalar, DecimalScalar } from './scalars';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      graphiql: true,
      autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'),
      context: async () => ({}),
      resolvers: {
        Date: DateScalar,
        DateIso: DateIsoScalar,
        Decimal: DecimalScalar,
      },
    }),
    ItemCostModule,
  ],
  providers: [
    ConstantsResolver,
  ],
})
export class GraphqlModule { }