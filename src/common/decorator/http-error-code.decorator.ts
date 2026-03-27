import { HttpStatus } from '@nestjs/common';
import 'reflect-metadata';

export const HTTP_ERROR_CODE_METADATA_KEY = 'http:error:code';

export function HttpErrorCode(code: HttpStatus) {
  return (target: any) => {
    Reflect.defineMetadata(HTTP_ERROR_CODE_METADATA_KEY, code, target);
  };
}

export function getHttpCodeFromError(error: any): HttpStatus | undefined {
  let current = error?.constructor;

  while (current && current !== Object) {
    const code = Reflect.getMetadata(HTTP_ERROR_CODE_METADATA_KEY, current);

    if (code !== undefined) {
      return code;
    }

    current = Object.getPrototypeOf(current);
  }

  return undefined;
}
