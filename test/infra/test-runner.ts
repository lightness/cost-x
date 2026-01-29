import { IDescribeRunner, Test } from './describe-runner';

export interface ITestRunner {
  registerTestInJest(test: Test, describeRunner: IDescribeRunner);
  registerTestsInJest(describeRunner: IDescribeRunner);
}

export class TestRunner implements ITestRunner {
  registerTestInJest(test: Test, describeRunner: IDescribeRunner) {
    const clazzInstance = describeRunner.getClassInstance();

    it(test.description, async () => {
      await clazzInstance[test.methodName].apply(clazzInstance); // TODO: add args
    });
  }

  registerTestsInJest(describeRunner: IDescribeRunner) {
    for (const testEntity of describeRunner.getTests()) {
      this.registerTestInJest(testEntity, describeRunner);
    }
  }
}
