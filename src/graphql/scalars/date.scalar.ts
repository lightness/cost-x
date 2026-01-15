import { GraphQLScalarType, Kind, type ValueNode } from 'graphql';

export const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type in YYYY-MM-DD format',
  serialize: (value: Date) => {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);

    return date.toISOString().split('T')[0];
  },
  parseValue: (value: string) => {
    if (!value) return null;

    return new Date(`${value}T00:00:00.000Z`);
  },
  parseLiteral: (ast: ValueNode) => {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }

    return null;
  },
});
