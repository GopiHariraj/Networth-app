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
                date: new Date(dto.date),
                amount: dto.amount,
                currency: dto.currency || 'AED',
                category: dto.category,
                merchant: dto.merchant,
                paymentMethod: dto.paymentMethod,
                accountId: dto.accountId,
                recurrence: dto.recurrence || 'one-time',
                periodTag: dto.periodTag,
                notes: dto.notes,
                source: dto.source || 'manual',
                receiptUrl: dto.receiptUrl,
                confidence: dto.confidence,
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
            data: {
                date: dto.date ? new Date(dto.date) : undefined,
                amount: dto.amount,
                currency: dto.currency,
                category: dto.category,
                merchant: dto.merchant,
                paymentMethod: dto.paymentMethod,
                accountId: dto.accountId,
                recurrence: dto.recurrence,
                periodTag: dto.periodTag,
                notes: dto.notes,
                source: dto.source,
                receiptUrl: dto.receiptUrl,
                confidence: dto.confidence,
            },
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

    async getInsights(userId: string) {
        const expenses = await this.findAll(userId);
        const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

        // Group by category
        const constByCategory = expenses.reduce((acc: any, exp) => {
            if (!acc[exp.category]) acc[exp.category] = 0;
            acc[exp.category] += Number(exp.amount);
            return acc;
        }, {});

        // Monthly trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        const monthlyTrend = expenses
            .filter(e => new Date(e.date) >= sixMonthsAgo)
            .reduce((acc: any, exp) => {
                const month = new Date(exp.date).toLocaleString('default', { month: 'short', year: '2-digit' });
                if (!acc[month]) acc[month] = 0;
                acc[month] += Number(exp.amount);
                return acc;
            }, {});

        return {
            total,
            count: expenses.length,
            constByCategory,
            monthlyTrend: Object.keys(monthlyTrend).map(month => ({ month, amount: monthlyTrend[month] })),
        };
    }
}
