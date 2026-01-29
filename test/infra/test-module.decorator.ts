import { ModuleMetadata } from '@nestjs/common';
import { Class } from './interfaces';

const TEST_MODULE_PARAMS_KEY = 'x-test:test-module-params';

export function TestModule(moduleMetadata: ModuleMetadata) {
  return (ctor: Class) => {
    // test module params
    Reflect.defineMetadata(TEST_MODULE_PARAMS_KEY, moduleMetadata, ctor);

    // save all
    // const testClasses = Reflect.getMetadata(ALL_TEST_CLASSES, NestTestRunner) || [];
    // testClasses.push(ctor);
    // Reflect.defineMetadata(ALL_TEST_CLASSES, testClasses, NestTestRunner);
  };
}
