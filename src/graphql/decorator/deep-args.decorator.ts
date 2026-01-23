import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { get } from 'radash';

export const DeepArgs = createParamDecorator(
  (path: string, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const args = ctx.getArgs();

    return path ? get(args, path) : args;
  },
);
