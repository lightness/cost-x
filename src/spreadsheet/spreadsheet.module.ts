import { Module } from '@nestjs/common';
import { SpreadsheetService } from './spreadsheet.service';
import { spreadsheetProviders } from './spreadsheet.providers';

@Module({
  providers: [...spreadsheetProviders, SpreadsheetService],
  exports: [SpreadsheetService],
})
export class SpreadsheetModule {}
