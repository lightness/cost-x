import { Injectable, Logger } from '@nestjs/common';
import inquirer from 'inquirer';
import { Credentials } from './interface';

@Injectable()
export class InquirerService {
  private readonly logger = new Logger(InquirerService.name);

  private emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async askForCredentials(): Promise<Credentials> {
    const name = await this.askForName();
    const email = await this.askForEmail();
    let password: string;
    let repeatedPassword: string;

    while (!(password && repeatedPassword && password === repeatedPassword)) {
      if (password && repeatedPassword) {
        this.logger.warn(`Passwords does not match. Try again`);
      }

      password = await this.askForPassword();
      repeatedPassword = await this.askForPassword('Confirm your password:');
    }

    return { email, name, password };
  }

  private async askForName(
    message: string = 'Enter your name:',
  ): Promise<string> {
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

  private async askForEmail(
    message: string = 'Enter your email:',
  ): Promise<string> {
    const questions = [
      {
        message,
        name: 'email',
        type: 'input',
        validate: (input: string) => {
          return (
            this.emailRegex.test(input) || 'Please enter a valid email address'
          );
        },
      },
    ];

    const answers = await inquirer.prompt(questions);

    return answers.email;
  }

  private async askForPassword(
    message: string = 'Enter your password:',
    mask: boolean = true,
  ): Promise<string> {
    const questions = [
      {
        mask: mask ? '*' : undefined,
        message,
        name: 'password',
        type: mask ? 'password' : 'input',
        validate: (input: string) => {
          return (
            input.length >= 6 || 'Password must be at least 6 characters long'
          );
        },
      },
    ];

    const answers = await inquirer.prompt(questions);

    return answers.password;
  }
}
