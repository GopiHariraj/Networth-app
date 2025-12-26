import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';

@Injectable()
export class ExpensesService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: string) {
        return this.prisma.expense.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
        });
    }

    async findOne(id: string, userId: string) {
        return this.prisma.expense.findFirst({
            where: { id, userId },
        });
    }

    async create(userId: string, dto: CreateExpenseDto) {
        return this.prisma.expense.create({
            data: {
                userId,
                ...dto,
            },
        });
    }

    async update(id: string, userId: string, dto: UpdateExpenseDto) {
        const expense = await this.findOne(id, userId);
        if (!expense) {
            throw new NotFoundException('Expense not found');
        }

        return this.prisma.expense.update({
            where: { id },
            data: dto,
        });
    }

    async delete(id: string, userId: string) {
        const expense = await this.findOne(id, userId);
        if (!expense) {
            throw new NotFoundException('Expense not found');
        }

        await this.prisma.expense.delete({
            where: { id },
        });

        return { success: true, message: 'Expense deleted' };
    }
}
