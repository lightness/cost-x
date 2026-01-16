import { IsHexColor, IsOptional, IsString } from 'class-validator';

export class TagInDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsHexColor()
  color?: string;
}
