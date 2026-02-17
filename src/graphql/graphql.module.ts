import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'node:path';
import { get } from 'radash';
import { DateIsoScalar, DateScalar, DecimalScalar } from './scalar';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'),
      context: async () => ({}),
      driver: ApolloDriver,
      formatError: (err) => {
        return {
          code: err.extensions.code,
          details: err.extensions.details,
          error: err.extensions.error,
          message: get(err, 'extensions.originalError.message', err.message),
          status: err.extensions.status,
        };
      },
      graphiql: true,
      resolvers: {
        Date: DateScalar,
        DateIso: DateIsoScalar,
        Decimal: DecimalScalar,
      },
    }),
  ],
  providers: [],
})
export class GraphqlModule {}
