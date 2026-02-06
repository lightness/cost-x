import { ConfigService } from '@nestjs/config';
import { GoogleAuth } from 'google-auth-library';

export const spreadsheetProviders = [
  {
    inject: [ConfigService],
    provide: GoogleAuth,
    useFactory: (configService: ConfigService) => {
      const scopes = configService.get<string[]>('spreadsheet.scopes');

      const auth = new GoogleAuth({ scopes });

      return auth;
    },
  },
];
