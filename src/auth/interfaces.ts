import type { StringValue } from 'ms';

export type ExpiresIn = StringValue | number;

export interface JwtConfig {
  secret: string;
  ttl: ExpiresIn;
}

export interface JwtPayload {
  id: number;
}
