import { Module } from '@nestjs/common';
import { BcryptService } from './bcrypt.service';
import { PasswordValidationService } from './password-validation.service';

@Module({
  exports: [BcryptService, PasswordValidationService],
  providers: [BcryptService, PasswordValidationService],
})
export class PasswordModule {}
