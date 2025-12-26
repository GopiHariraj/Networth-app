import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateStockAssetDto {
  @IsString()
  @IsNotEmpty()
  symbol: string; // AAPL, RELIANCE.NS

  @IsString()
  @IsNotEmpty()
  name: string; // Apple Inc., Reliance Industries

  @IsString()
  @IsNotEmpty()
  exchange: string; // NASDAQ, NSE

  @IsNotEmpty()
  quantity: number;

  @IsNotEmpty()
  avgPrice: number;

  @IsNotEmpty()
  currentPrice: number;

  @IsString()
  @IsOptional()
  broker?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateStockAssetDto {
  @IsString()
  @IsOptional()
  symbol?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  exchange?: string;

  @IsOptional()
  quantity?: number;

  @IsOptional()
  avgPrice?: number;

  @IsOptional()
  currentPrice?: number;

  @IsString()
  @IsOptional()
  broker?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
