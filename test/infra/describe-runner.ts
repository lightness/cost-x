import { Class, DescribeType } from './interfaces';
import { TestRunner } from './test-runner';

export interface Test {
  methodName: string;
  description: string;
}

export interface IDescribeRunner {
  registerDescribeInJest();
  setDescribeName(name: string);
  setDescribeType(describeType: DescribeType);
  registerTest(test: Test);
  getTests(): Test[];
  getClassInstance(): object;
}

export class DescribeRunner implements IDescribeRunner {
  // private static readonly DESCRIBE_REGISTRY: WeakMap<Class, IDescribeRunner> = new WeakMap();
  private static readonly DESCRIBE_REGISTRY: Map<Class, IDescribeRunner> = new Map();

  public static getDescribeRunner(clazz?: Class, autoCreate: boolean = true): IDescribeRunner {
    // console.log('🔮', clazz, autoCreate, DescribeRunner.DESCRIBE_REGISTRY);
    let describeService: IDescribeRunner = DescribeRunner.DESCRIBE_REGISTRY.get(clazz);

    if (!describeService && autoCreate) {
      describeService = new DescribeRunner(clazz);
      DescribeRunner.DESCRIBE_REGISTRY.set(clazz, describeService);
    }

    return describeService;
  }

  private describeName: string;
  private describeType: DescribeType;
  private tests: Test[] = [];

  private testRunner = new TestRunner();

  private constructor(
    private readonly clazz: Class,
    private readonly clazzInstance = new clazz(),
  ) {}

  setDescribeName(name: string) {
    this.describeName = name;
  }

  setDescribeType(describeType: DescribeType) {
    this.describeType = describeType;
  }

  registerDescribeInJest() {
    this.getDescribeFn()(this.describeName, () => {
      this.testRunner.registerTestsInJest(this); //, parentDescribeService
    });
  }

  getDescribeFn() {
    switch (this.describeType) {
      case DescribeType.DEFAULT:
        return describe;
      case DescribeType.SKIP:
        return describe.skip;
      case DescribeType.ONLY:
        return describe.only;
    }
  }

  registerTest(test: Test) {
    this.tests.push(test);
  }

  getTests(): Test[] {
    return [...this.tests];
  }

  getClassInstance(): object {
    return this.clazzInstance;
  }
}
