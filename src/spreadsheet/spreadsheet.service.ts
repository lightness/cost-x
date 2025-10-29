import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { GoogleAuth } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { RowDto } from './dto/row.dto';

@Injectable()
export class SpreadsheetService {
  private readonly logger = new Logger('SpreadsheetService');

  constructor(private googleAuth: GoogleAuth, private configService: ConfigService) {}

  async loadEverything(): Promise<RowDto[]> {
    const document = await this.getDocument();

    const sheetName = this.configService.get<string>('spreadsheet.name');
    const sheet = document.sheetsByTitle[sheetName];

    const rows = await sheet.getRows();
    this.logger.log(`Pulled ${rows.length} rows`);

    const normalizedRows = this.normalize(rows);

    return plainToInstance(RowDto, normalizedRows);
  }

  private normalize(rows): RowDto[] {
    return rows.slice(1).map((row) => {
      return this.columnNames.map((columnName, index) => ({ [columnName]: row._rawData[index] })).reduce((acc, cur) => ({ ...acc, ...cur }), {});
    })
  }

  private async getDocument(): Promise<GoogleSpreadsheet> {
    const spreadsheetId = this.configService.get<string>('spreadsheet.id');

    this.logger.log('Accessing Google Spreadsheet...');
    const doc = new GoogleSpreadsheet(spreadsheetId, this.googleAuth);

    await doc.loadInfo();
    this.logger.log('Google Spreadsheet loaded');

    return doc;
  }

  private get columnNames(): string[] {
    return this.configService.getOrThrow<string[]>('spreadsheet.columnNames');
  }
}
