import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateLoanDto {
  @IsString()
  @IsNotEmpty()
  loanType: string; // Home, Car, Personal, Credit Card

  @IsString()
  @IsNotEmpty()
  lenderName: string;

  @IsNotEmpty()
  principal: number;

  @IsNotEmpty()
  interestRate: number;

  @IsNotEmpty()
  emiAmount: number;

  @IsNotEmpty()
  outstanding: number;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateLoanDto {
  @IsString()
  @IsOptional()
  loanType?: string;

  @IsString()
  @IsOptional()
  lenderName?: string;

  @IsOptional()
  principal?: number;

  @IsOptional()
  interestRate?: number;

  @IsOptional()
  emiAmount?: number;

  @IsOptional()
  outstanding?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
