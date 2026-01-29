import { DescribeRunner } from './describe-runner';
import { Class } from './interfaces';

export function It(itName?: string) {
  return (target: unknown, propertyKey: string, _: PropertyDescriptor) => {
    console.log('IT');
    const describeRunner = DescribeRunner.getDescribeRunner(target.constructor as Class);

    describeRunner.registerTest({
      description: itName ?? propertyKey,
      methodName: propertyKey,
    });
  };
}
