import { Injectable } from '@nestjs/common';

@Injectable()
export class DateService {
  toString(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  fromString(str: string): Date {
    return new Date(`${str}T00:00:00Z`);
  }
}
