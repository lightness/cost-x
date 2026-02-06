import { GraphQLScalarType, Kind, ValueNode } from 'graphql';

export const DateIsoScalar = new GraphQLScalarType({
  description: 'Date custom scalar type in ISO format',
  name: 'DateIso',
  parseLiteral: (ast: ValueNode) => {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }

    return null;
  },
  parseValue: (value: string) => new Date(value),
  serialize: (value: Date) => value.toISOString(),
});
