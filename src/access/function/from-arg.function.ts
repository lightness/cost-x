import { GqlExecutionContext } from '@nestjs/graphql';
import { get } from 'radash';

export const fromArg = (path: string) => (ctx: GqlExecutionContext) =>
  get<number>(ctx.getArgs(), path);
