import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/entity/user.entity';
import { ConfirmEmailStrategy } from './confirm-email-strategy.enum';
import { AutoConfirmEmailService } from './strategy/auto/auto-confirm-email.service';
import { IConfirmEmailStrategy } from './strategy/interfaces';
import { ManualConfirmEmailService } from './strategy/manual/manual-confirm-email.service';

@Injectable()
export class ConfirmEmailService {
  constructor(
    private configService: ConfigService,
    private manualConfirmEmailService: ManualConfirmEmailService,
    private autoConfirmEmailService: AutoConfirmEmailService,
  ) {}

  private get strategy(): ConfirmEmailStrategy {
    return this.configService.getOrThrow<ConfirmEmailStrategy>(
      'confirmEmail.strategy',
    );
  }

  private get confirmEmailStrategy(): IConfirmEmailStrategy {
    switch (this.strategy) {
      case ConfirmEmailStrategy.MANUAL:
        return this.manualConfirmEmailService;
      case ConfirmEmailStrategy.AUTO:
        return this.autoConfirmEmailService;
      default:
        throw new InternalServerErrorException(
          `Unknown confirm email strategy is set: ${this.strategy}`,
        );
    }
  }

  async runConfirmationProcess(user: User): Promise<User> {
    return this.confirmEmailStrategy.initiateFlow(user);
  }
}
