import { Describe } from './infra/describe.decorator';
import { It } from './infra/it.decorator';
import { TestSpec } from './test.spec';

// @TestModule({ imports: [GroupModule] })
@Describe('nested test suite')
export class NestedTestSpec extends TestSpec {
  protected prepareData() {
    return {
      ...super.prepareData(),
      isActive: true,
    };
  }

  @It('should have isActive flag')
  testUser() {
    const data = this.prepareData();

    expect(data.isActive).toBe(true);
  }
}
