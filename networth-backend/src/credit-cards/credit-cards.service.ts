import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCreditCardDto, UpdateCreditCardDto } from './dto/credit-card.dto';

@Injectable()
export class CreditCardsService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: string) {
        return this.prisma.creditCard.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, userId: string) {
        return this.prisma.creditCard.findFirst({
            where: { id, userId },
        });
    }

    async create(userId: string, dto: CreateCreditCardDto) {
        return this.prisma.creditCard.create({
            data: {
                userId,
                ...dto,
            },
        });
    }

    async update(id: string, userId: string, dto: UpdateCreditCardDto) {
        const card = await this.findOne(id, userId);
        if (!card) {
            throw new NotFoundException('Credit card not found');
        }

        return this.prisma.creditCard.update({
            where: { id },
            data: dto,
        });
    }

    async delete(id: string, userId: string) {
        const card = await this.findOne(id, userId);
        if (!card) {
            throw new NotFoundException('Credit card not found');
        }

        await this.prisma.creditCard.delete({
            where: { id },
        });

        return { success: true, message: 'Credit card deleted' };
    }
}
