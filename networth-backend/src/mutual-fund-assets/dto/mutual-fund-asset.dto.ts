import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
} from 'class-validator';

export class CreateMutualFundAssetDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    provider?: string;

    @IsString()
    @IsOptional()
    folioNumber?: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsNumber()
    @IsOptional()
    units?: number;

    @IsNumber()
    @IsOptional()
    nav?: number;

    @IsNumber()
    @IsNotEmpty()
    currentValue: number;

    @IsNumber()
    @IsNotEmpty()
    investedAmount: number;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateMutualFundAssetDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    provider?: string;

    @IsString()
    @IsOptional()
    folioNumber?: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsNumber()
    @IsOptional()
    units?: number;

    @IsNumber()
    @IsOptional()
    nav?: number;

    @IsNumber()
    @IsOptional()
    currentValue?: number;

    @IsNumber()
    @IsOptional()
    investedAmount?: number;

    @IsString()
    @IsOptional()
    notes?: string;
}
