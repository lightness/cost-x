import { CustomScalar, Scalar } from '@nestjs/graphql';
import { ValueNode } from 'graphql';
import GraphQLJSON from 'graphql-type-json';

@Scalar('Json', () => Object)
export class JsonScalar implements CustomScalar<any, any> {
  description = GraphQLJSON.description;

  parseValue(value: any) {
    return GraphQLJSON.parseValue(value);
  }

  serialize(value: any) {
    return GraphQLJSON.serialize(value);
  }

  parseLiteral(ast: ValueNode) {
    return GraphQLJSON.parseLiteral(ast, {});
  }
}
