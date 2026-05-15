import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { validatePassword } from './password-validation.service';

export const IsValidPassword = (options?: ValidationOptions) => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isValidPassword',
      options,
      propertyName,
      target: object.constructor,
      validator: {
        defaultMessage(args: ValidationArguments): string {
          const result = validatePassword(args.value as string);

          return typeof result === 'string' ? result : 'Invalid password';
        },
        validate(value: string): boolean {
          return validatePassword(value) === true;
        },
      },
    });
  };
};
