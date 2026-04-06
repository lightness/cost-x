import { GraphQLScalarType } from 'graphql';
import GraphQLJSON from 'graphql-type-json';

export const JsonScalar = new GraphQLScalarType({
  description: GraphQLJSON.description,
  name: 'Json',
  parseLiteral: (ast) => GraphQLJSON.parseLiteral(ast, {}),
  parseValue: GraphQLJSON.parseValue,
  serialize: GraphQLJSON.serialize,
});
