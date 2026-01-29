import { DescribeRunner } from './describe-runner';
import { Class, DescribeType, ExtendedDescribe } from './interfaces';

function createDescribeDecorator(describeType: DescribeType) {
  return function Describe(describeName?: string) {
    return (clazz: Class) => {
      console.log('DESCRIBE');
      const describeRunner = DescribeRunner.getDescribeRunner(clazz, false);
      const parentDescribeRunner = DescribeRunner.getDescribeRunner(
        (clazz as any).__proto__,
        false,
      );

      console.log('>>> parentDescribeRunner', parentDescribeRunner);

      describeRunner.setDescribeName(describeName ?? clazz.name);
      describeRunner.setDescribeType(describeType);

      if (parentDescribeRunner) {
        parentDescribeRunner.setDescribeType(describeType); // ?
      }

      describeRunner.registerDescribeInJest();
    };
  };
}

export const Describe: ExtendedDescribe = createDescribeDecorator(DescribeType.DEFAULT);
Describe.skip = createDescribeDecorator(DescribeType.SKIP);
Describe.only = createDescribeDecorator(DescribeType.ONLY);
