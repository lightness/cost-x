import type { PipeTransform, Type } from '@nestjs/common';
import type { GqlExecutionContext } from '@nestjs/graphql';

export const INFER_METADATA_KEY = 'infer';

export interface InferOptions {
  from: (ctx: GqlExecutionContext) => unknown;
  pipes: Type<PipeTransform>[];
}

export interface InferEntry {
  key: string;
  options: InferOptions;
}

export const Infer = (key: string, options: InferOptions): MethodDecorator =>
  (target, propertyKey, descriptor) => {
    const existing: InferEntry[] =
      Reflect.getMetadata(INFER_METADATA_KEY, descriptor.value) ?? [];

    Reflect.defineMetadata(
      INFER_METADATA_KEY,
      [...existing, { key, options }],
      descriptor.value,
    );

    return descriptor;
  };
