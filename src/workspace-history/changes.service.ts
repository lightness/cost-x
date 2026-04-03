import { Injectable } from '@nestjs/common';

@Injectable()
export class ChangesService {
  getDiff<O extends Record<string, unknown>, N extends Record<string, unknown>>(
    oldObject: O,
    newObject: N,
    whitelistedKeys?: (keyof O & keyof N)[],
  ): Record<string, { oldValue: unknown; newValue: unknown }> {
    const diff: Record<string, { oldValue: unknown; newValue: unknown }> = {};

    const allKeys = new Set([...Object.keys(oldObject), ...Object.keys(newObject)]);

    for (const key of allKeys) {
      const oldVal = oldObject[key];
      const newVal = newObject[key];

      if (oldVal !== newVal && (!whitelistedKeys || whitelistedKeys.includes(key))) {
        diff[key] = { newValue: newVal, oldValue: oldVal };
      }
    }

    return diff;
  }
}
