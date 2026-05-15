import { Injectable } from '@nestjs/common';

export const validatePassword = (input: string): string | true => {
  if (input.length < 10) {
    return 'Password must be at least 10 characters long';
  }

  if (!/[A-Z]/.test(input)) {
    return 'Password must contain at least one uppercase letter';
  }

  if (!/[a-z]/.test(input)) {
    return 'Password must contain at least one lowercase letter';
  }

  if (!/[0-9]/.test(input)) {
    return 'Password must contain at least one number';
  }

  if (!/[^A-Za-z0-9]/.test(input)) {
    return 'Password must contain at least one special character';
  }

  return true;
};

@Injectable()
export class PasswordValidationService {
  validate(password: string): string | true {
    return validatePassword(password);
  }
}
