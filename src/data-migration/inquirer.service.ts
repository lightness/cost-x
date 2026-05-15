import { Injectable } from '@nestjs/common';
import inquirer from 'inquirer';
import { Currency } from '../currency-rate/entity/currency.enum';
import { PasswordValidationService } from '../password/password-validation.service';
import { PrismaService } from '../prisma/prisma.service';
import { Credentials } from './interfaces';

@Injectable()
export class InquirerService {
  private emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(
    private prisma: PrismaService,
    private passwordValidation: PasswordValidationService,
  ) {}

  async askForDefaultCurrency(message: string = 'Pick workspace currency:'): Promise<Currency> {
    const questions = [
      {
        choices: Object.values(Currency),
        message,
        name: 'defaultCurrency',
        type: 'select',
      },
    ];

    const answers = await inquirer.prompt(questions);

    return answers.defaultCurrency;
  }

  async askForCredentials(): Promise<Credentials> {
    const name = await this.askForName();
    const email = await this.askForEmail();
    const password = await this.askForPassword();
    await this.askForConfirmPassword(password);

    return { email, name, password };
  }

  private async askForName(message: string = 'Enter your name:'): Promise<string> {
    const questions = [
      {
        message,
        name: 'name',
        type: 'input',
        validate: (input: string) => {
          return input.length <= 50 || 'Please enter a valid email address';
        },
      },
    ];

    const answers = await inquirer.prompt(questions);

    return answers.name;
  }

  private async askForEmail(message: string = 'Enter your email:'): Promise<string> {
    const questions = [
      {
        message,
        name: 'email',
        type: 'input',
        validate: async (input: string) => {
          if (!this.emailRegex.test(input)) {
            return 'Please enter a valid email address';
          }

          const existing = await this.prisma.user.findUnique({
            where: { email: input.toLowerCase() },
          });

          return existing ? 'Email is already taken' : true;
        },
      },
    ];

    const answers = await inquirer.prompt(questions);

    return answers.email;
  }

  private async askForPassword(message: string = 'Enter your password:'): Promise<string> {
    const answers = await inquirer.prompt([
      {
        mask: '*',
        message,
        name: 'password',
        type: 'password',
        validate: (input: string) => this.passwordValidation.validate(input),
      },
    ]);

    return answers.password;
  }

  private async askForConfirmPassword(password: string): Promise<void> {
    await inquirer.prompt([
      {
        mask: '*',
        message: 'Confirm your password:',
        name: 'confirmPassword',
        type: 'password',
        validate: (input: string) => {
          return input === password || 'Passwords do not match';
        },
      },
    ]);
  }
}
