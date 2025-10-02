import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { GetItemQueryDto } from './get-item.query.dto';

export class ListItemQueryDto extends GetItemQueryDto {
  @IsString()
  @IsOptional()
  term?: string;
}