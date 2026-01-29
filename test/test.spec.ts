import { Describe } from './infra/describe.decorator';
import { It } from './infra/it.decorator';

// @TestModule({ imports: [GroupModule] })
@Describe.only()
export class TestSpec {
  protected prepareData() {
    return {
      password: 'Test12345',
      user: 'Vova',
    };
  }

  @It('should have user name')
  testUser() {
    const data = this.prepareData();

    expect(data.user).toBe('Vova');
  }

  @It('should have password')
  testPassword() {
    const data = this.prepareData();

    expect(data.password).toBeDefined();
  }
}
