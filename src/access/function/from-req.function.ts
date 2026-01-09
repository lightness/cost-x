import { GqlExecutionContext } from '@nestjs/graphql';
import { get } from 'radash';

export const fromReq = (path: string) => 
  (ctx: GqlExecutionContext) => get<number>(ctx.getContext()?.req, path);
