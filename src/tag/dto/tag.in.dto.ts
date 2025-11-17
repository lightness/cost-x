import { IsHexColor, IsOptional, IsString, Length } from 'class-validator';

export class TagInDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsHexColor()
  color: string;
}