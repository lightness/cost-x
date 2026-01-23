import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'node:path';
import { ItemCostModule } from '../item-cost/default-currency-cost.module';
import { ConstantsResolver } from './resolvers/constants.resolver';
import { DateIsoScalar, DateScalar, DecimalScalar } from './scalars';
import { get } from 'radash';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'),
      context: async () => ({}),
      driver: ApolloDriver,
      formatError: (err) => ({
        message: get(err, 'extensions.originalError.message', err.message),
        status: err.extensions.code,
      }),
      graphiql: true,
      resolvers: {
        Date: DateScalar,
        DateIso: DateIsoScalar,
        Decimal: DecimalScalar,
      },
    }),
    ItemCostModule,
  ],
  providers: [ConstantsResolver],
})
export class GraphqlModule {}
