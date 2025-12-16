import { GraphQLScalarType, Kind, ValueNode } from 'graphql';

export const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type in YYYY-MM-DD format',
  serialize: (value: Date) => {
    return value.toISOString().split('T')[0];
  },
  parseValue: (value: string) => new Date(value),
  parseLiteral: (ast: ValueNode) => {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }

    return null;
  },
});
