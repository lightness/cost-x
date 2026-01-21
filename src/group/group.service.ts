import { Injectable } from '@nestjs/common';

@Injectable()
export class GroupService {
  groupBy<T, K extends keyof T>(items: T[], key: K): Map<T[K], T[]> {
    const result = new Map<T[K], T[]>();

    for (const item of items) {
      const keyValue = item[key];
      const existing = result.get(keyValue);

      if (existing) {
        existing.push(item);
      } else {
        result.set(keyValue, [item]);
      }
    }

    return result;
  }
}