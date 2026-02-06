import { Module } from '@nestjs/common';
import { SpreadsheetService } from './spreadsheet.service';
import { spreadsheetProviders } from './spreadsheet.providers';

@Module({
  exports: [SpreadsheetService],
  providers: [...spreadsheetProviders, SpreadsheetService],
})
export class SpreadsheetModule {}
