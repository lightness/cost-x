import { GqlExecutionContext } from '@nestjs/graphql';
import { get } from 'radash';

export const fromReq =
  <T = number>(path: string) =>
  (ctx: GqlExecutionContext) =>
    get<T>(ctx.getContext()?.req, path);
