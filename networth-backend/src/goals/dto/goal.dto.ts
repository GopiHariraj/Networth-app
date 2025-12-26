import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsDateString,
    IsBoolean,
} from 'class-validator';

export class CreateGoalDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    type: string; // NETWORTH, GOLD, PROPERTY, STOCKS, etc.

    @IsNumber()
    @IsNotEmpty()
    targetAmount: number;

    @IsNumber()
    @IsOptional()
    currentAmount?: number;

    @IsDateString()
    @IsNotEmpty()
    targetDate: string;

    @IsString()
    @IsOptional()
    priority?: string;

    @IsString()
    @IsOptional()
    linkedAccountId?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateGoalDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsNumber()
    @IsOptional()
    targetAmount?: number;

    @IsNumber()
    @IsOptional()
    currentAmount?: number;

    @IsDateString()
    @IsOptional()
    targetDate?: string;

    @IsString()
    @IsOptional()
    priority?: string;

    @IsString()
    @IsOptional()
    linkedAccountId?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsBoolean()
    @IsOptional()
    isCompleted?: boolean;
}
