import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const Token = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;

    return req.token;
  },
);
