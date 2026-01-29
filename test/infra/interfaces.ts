// biome-ignore lint/complexity/noBannedTypes: i want
export type Class = new (...args: unknown[]) => {};

export enum DescribeType {
  DEFAULT = 'default',
  ONLY = 'only',
  SKIP = 'skip',
}

export type DescribeDecorator = (describeName?: string) => (clazz: Class) => void;

export type ExtendedDescribe = DescribeDecorator & {
  only?: DescribeDecorator;
  skip?: DescribeDecorator;
};
