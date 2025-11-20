import { IsOptional, IsString } from 'class-validator';

export class ListTagQueryDto {
  @IsString()
  @IsOptional()
  title?: string;
}