import { StringValue } from 'ms';

export interface JwtConfig {
  secret: string;
  ttl: StringValue | number;
}

export interface TokenPayload {
  id: number;
}
