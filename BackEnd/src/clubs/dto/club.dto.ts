import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClubDto {
  @IsString()
  name: string;

  @IsString() @IsOptional()
  description?: string;

  @IsNumber() @Type(() => Number)
  price: number;

  @IsString() @IsOptional()
  age_group?: string;

  @IsString() @IsOptional()
  type?: string;

  @IsBoolean() @IsOptional()
  is_active?: boolean;
}

export class UpdateClubDto {
  @IsString() @IsOptional()
  name?: string;

  @IsString() @IsOptional()
  description?: string;

  @IsNumber() @Type(() => Number) @IsOptional()
  price?: number;

  @IsString() @IsOptional()
  age_group?: string;

  @IsString() @IsOptional()
  type?: string;

  @IsBoolean() @IsOptional()
  is_active?: boolean;
}
