import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';

@Injectable()
export class GoalsService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: string) {
        return this.prisma.goal.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, userId: string) {
        return this.prisma.goal.findFirst({
            where: { id, userId },
        });
    }

    async create(userId: string, dto: CreateGoalDto) {
        return this.prisma.goal.create({
            data: {
                userId,
                ...dto,
            },
        });
    }

    async update(id: string, userId: string, dto: UpdateGoalDto) {
        const goal = await this.findOne(id, userId);
        if (!goal) {
            throw new NotFoundException('Goal not found');
        }

        return this.prisma.goal.update({
            where: { id },
            data: dto,
        });
    }

    async delete(id: string, userId: string) {
        const goal = await this.findOne(id, userId);
        if (!goal) {
            throw new NotFoundException('Goal not found');
        }

        await this.prisma.goal.delete({
            where: { id },
        });

        return { success: true, message: 'Goal deleted' };
    }
}
