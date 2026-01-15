import { GraphQLScalarType, Kind, type ValueNode } from 'graphql';

export const DateIsoScalar = new GraphQLScalarType({
  name: 'DateIso',
  description: 'Date custom scalar type in ISO format',
  serialize: (value: Date) => value.toISOString(),
  parseValue: (value: string) => new Date(value),
  parseLiteral: (ast: ValueNode) => {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }

    return null;
  },
});
