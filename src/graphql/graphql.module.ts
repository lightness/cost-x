import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'node:path';
import { get } from 'radash';
import { GraphqlController } from './graphql.controller';
import { DateIsoScalar, DateScalar, DecimalScalar, JsonScalar } from './scalar';

@Module({
  controllers: [GraphqlController],
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        autoSchemaFile: configService.getOrThrow('graphql.writeSchema')
          ? join(process.cwd(), 'src/graphql/schema.gql')
          : true,
        sortSchema: true,
        context: async () => ({}),
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
          Json: JsonScalar,
        },
        resolverValidationOptions: {
          requireResolversToMatchSchema: 'ignore',
        },
      }),
    }),
  ],
})
export class GraphqlModule {}
