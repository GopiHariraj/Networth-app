import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateGoldAssetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  weightGrams: number;

  @IsNotEmpty()
  purchasePrice: number;

  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @IsNotEmpty()
  currentValue: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateGoldAssetDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  weightGrams?: number;

  @IsOptional()
  purchasePrice?: number;

  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @IsOptional()
  currentValue?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
