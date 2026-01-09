import { applyDecorators } from '@nestjs/common';

interface MemoCacheEntry<T> {
  value: T;
}

const memoCache = new Map<string, MemoCacheEntry<any>>();

export function Memo() {
  return applyDecorators(
    (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;
      const cacheKeyPrefix = `${target.constructor.name}.${propertyName}`;

      descriptor.value = function (...args: any[]) {
        const cacheKey = `${cacheKeyPrefix}:${JSON.stringify(args)}`;
        const cached = memoCache.get(cacheKey);

        // Check if valid cache entry exists
        if (cached) {
          return cached.value;
        }

        const result = originalMethod.apply(this, args);

        // Handle promise results
        if (result instanceof Promise) {
          return result
            .then((asyncResult) => {
              memoCache.set(cacheKey, { value: asyncResult });

              return asyncResult;
            })
        } else {
          memoCache.set(cacheKey, { value: result });

          return result;
        }
      };

      return descriptor;
    }
  );
}
