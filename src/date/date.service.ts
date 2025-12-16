import { Injectable } from '@nestjs/common';

@Injectable()
export class DateService {
  getDatePart(date: Date): string {
    return date.toISOString().split('T')[0]
  }
}
