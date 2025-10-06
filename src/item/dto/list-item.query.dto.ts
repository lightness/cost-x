import { IsNumber, IsOptional, IsString } from 'class-validator';
import { GetItemQueryDto } from './get-item.query.dto';
import { Transform } from 'class-transformer';

export class ListItemQueryDto extends GetItemQueryDto {
  @IsString()
  @IsOptional()
  term?: string;

  @IsNumber({}, { each: true })
  @IsOptional()
  @Transform(({ value }) => (value || '').split(',').map(strId => parseInt(strId)))
  tagIds?: number[];
}