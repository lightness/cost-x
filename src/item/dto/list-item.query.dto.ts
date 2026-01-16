import { Transform } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export class ListItemQueryDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber({}, { each: true })
  @IsOptional()
  @Transform(({ value }) =>
    (value || '').split(',').map((strId) => parseInt(strId, 10)),
  )
  tagIds?: number[];

  @IsDate()
  @IsOptional()
  paymentDateFrom: Date;

  @IsDate()
  @IsOptional()
  paymentDateTo: Date;
}
