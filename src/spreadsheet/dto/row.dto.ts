import { Transform } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class RowDto {
  @IsNumber({ maxDecimalPlaces: 0 })
  rowNumber: number;

  @IsString()
  @Transform(({ value }) => value.trim())
  title: string;

  @IsString()
  @Transform(({ value }) => {
    if (!value || value === '-') {
      return null;
    }

    const [day, month, year] = value.split('.');

    return `${year}-${month}-${day}`;
  })
  date: string;

  @IsNumber()
  @Transform(({ value }) =>
    !value || value === '-' ? null : parseFloat(value.replace(',', '.')),
  )
  bynCost: number;

  @IsNumber()
  @Transform(({ value }) =>
    !value || value === '-' ? null : parseFloat(value.replace(',', '.')),
  )
  usdCost: number;

  @IsNumber()
  @Transform(({ value }) =>
    !value || value === '-' ? null : parseFloat(value.replace(',', '.')),
  )
  eurCost: number;
}
