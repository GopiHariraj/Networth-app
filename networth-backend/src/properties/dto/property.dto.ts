import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  propertyType: string; // Residential, Commercial, Land

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsNotEmpty()
  purchasePrice: number;

  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @IsNotEmpty()
  currentValue: number;

  @IsString()
  @IsOptional()
  linkedLoanId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdatePropertyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  propertyType?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsOptional()
  purchasePrice?: number;

  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @IsOptional()
  currentValue?: number;

  @IsString()
  @IsOptional()
  linkedLoanId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
