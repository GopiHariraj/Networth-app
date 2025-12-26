import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ExpenseCategoriesService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: string) {
        return this.prisma.expenseCategory.findMany({
            where: {
                OR: [
                    { userId },
                    { userId: null } // System default categories
                ]
            },
            orderBy: { name: 'asc' },
        });
    }

    async create(userId: string, name: string, icon?: string, color?: string) {
        return this.prisma.expenseCategory.create({
            data: {
                userId,
                name,
                icon,
                color,
                isCustom: true,
            },
        });
    }

    async delete(id: string, userId: string) {
        const category = await this.prisma.expenseCategory.findFirst({
            where: { id, userId, isCustom: true },
        });

        if (!category) {
            throw new NotFoundException('Custom category not found or is a system category');
        }

        await this.prisma.expenseCategory.delete({
            where: { id },
        });

        return { success: true, message: 'Category deleted' };
    }
}
