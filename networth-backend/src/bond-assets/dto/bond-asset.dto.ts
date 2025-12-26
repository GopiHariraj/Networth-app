import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsDateString,
} from 'class-validator';

export class CreateBondAssetDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    issuer?: string;

    @IsNumber()
    @IsNotEmpty()
    faceValue: number;

    @IsNumber()
    @IsNotEmpty()
    currentValue: number;

    @IsNumber()
    @IsNotEmpty()
    interestRate: number;

    @IsDateString()
    @IsOptional()
    maturityDate?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateBondAssetDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    issuer?: string;

    @IsNumber()
    @IsOptional()
    faceValue?: number;

    @IsNumber()
    @IsOptional()
    currentValue?: number;

    @IsNumber()
    @IsOptional()
    interestRate?: number;

    @IsDateString()
    @IsOptional()
    maturityDate?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
