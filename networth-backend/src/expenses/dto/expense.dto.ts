import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsDateString,
    IsDecimal,
} from 'class-validator';

export class CreateExpenseDto {
    @IsDateString()
    @IsNotEmpty()
    date: string;

    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsString()
    @IsNotEmpty()
    category: string;

    @IsString()
    @IsOptional()
    merchant?: string;

    @IsString()
    @IsOptional()
    paymentMethod?: string;

    @IsString()
    @IsOptional()
    accountId?: string;

    @IsString()
    @IsOptional()
    recurrence?: string;

    @IsString()
    @IsNotEmpty()
    periodTag: string; // daily, monthly, yearly

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsOptional()
    source?: string;

    @IsString()
    @IsOptional()
    receiptUrl?: string;

    @IsNumber()
    @IsOptional()
    confidence?: number;
}

export class UpdateExpenseDto {
    @IsDateString()
    @IsOptional()
    date?: string;

    @IsNumber()
    @IsOptional()
    amount?: number;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    merchant?: string;

    @IsString()
    @IsOptional()
    paymentMethod?: string;

    @IsString()
    @IsOptional()
    accountId?: string;

    @IsString()
    @IsOptional()
    recurrence?: string;

    @IsString()
    @IsOptional()
    periodTag?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsOptional()
    source?: string;

    @IsString()
    @IsOptional()
    receiptUrl?: string;

    @IsNumber()
    @IsOptional()
    confidence?: number;
}
