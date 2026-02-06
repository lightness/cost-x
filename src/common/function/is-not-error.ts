export const isNotError = <T>(x: T | Error): x is T => !(x instanceof Error);
