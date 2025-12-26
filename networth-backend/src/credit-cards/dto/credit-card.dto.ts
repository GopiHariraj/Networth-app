import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsInt,
    Min,
    Max,
} from 'class-validator';

export class CreateCreditCardDto {
    @IsString()
    @IsNotEmpty()
    cardName: string;

    @IsString()
    @IsNotEmpty()
    bankName: string;

    @IsNumber()
    @IsNotEmpty()
    creditLimit: number;

    @IsNumber()
    @IsNotEmpty()
    usedAmount: number;

    @IsInt()
    @Min(1)
    @Max(31)
    @IsOptional()
    dueDate?: number;

    @IsNumber()
    @IsOptional()
    interestRate?: number;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateCreditCardDto {
    @IsString()
    @IsOptional()
    cardName?: string;

    @IsString()
    @IsOptional()
    bankName?: string;

    @IsNumber()
    @IsOptional()
    creditLimit?: number;

    @IsNumber()
    @IsOptional()
    usedAmount?: number;

    @IsInt()
    @Min(1)
    @Max(31)
    @IsOptional()
    dueDate?: number;

    @IsNumber()
    @IsOptional()
    interestRate?: number;

    @IsString()
    @IsOptional()
    notes?: string;
}
