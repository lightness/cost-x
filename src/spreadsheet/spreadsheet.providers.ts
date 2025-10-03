import { ConfigService } from '@nestjs/config';
import { GoogleAuth } from 'google-auth-library';

export const spreadsheetProviders = [
  {
    provide: GoogleAuth,
    useFactory: (configService: ConfigService) => {
      const scopes = configService.get<string[]>('spreadsheet.scopes');

      const auth = new GoogleAuth({ scopes });

      return auth;
    },
    inject: [ConfigService],
  },
];
