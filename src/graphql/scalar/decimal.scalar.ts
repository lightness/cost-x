import { Decimal } from '@prisma/client/runtime/client';
import { GraphQLScalarType, Kind, ValueNode } from 'graphql';

export const DecimalScalar = new GraphQLScalarType({
  description: 'Decimal number',
  name: 'Decimal',

  parseLiteral: (ast: ValueNode): Decimal => {
    if (
      ast.kind === Kind.STRING ||
      ast.kind === Kind.INT ||
      ast.kind === Kind.FLOAT
    ) {
      return new Decimal(ast.value);
    }

    throw new Error('DecimalScalar can only parse string/int/float literals');
  },

  // GraphQL string | number -> Prisma Decimal
  parseValue: (value: unknown) => {
    if (typeof value === 'string' || typeof value === 'number') {
      return new Decimal(value);
    }

    throw new Error(`DecimalScalar cannot parse value: ${value}`);
  },

  // Prisma Decimal -> GraphQL string
  serialize: (value: unknown) => {
    if (!value) {
      return null;
    }

    if (value instanceof Decimal) {
      return value.toString();
    }

    // Handle if it's already a string or number
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }

    throw new Error(`DecimalScalar cannot serialize value: ${value}`);
  },
});
