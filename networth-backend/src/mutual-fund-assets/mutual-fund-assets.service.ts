import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateMutualFundAssetDto, UpdateMutualFundAssetDto } from './dto/mutual-fund-asset.dto';

@Injectable()
export class MutualFundAssetsService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: string) {
        return this.prisma.mutualFundAsset.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, userId: string) {
        return this.prisma.mutualFundAsset.findFirst({
            where: { id, userId },
        });
    }

    async create(userId: string, dto: CreateMutualFundAssetDto) {
        return this.prisma.mutualFundAsset.create({
            data: {
                userId,
                ...dto,
            },
        });
    }

    async update(id: string, userId: string, dto: UpdateMutualFundAssetDto) {
        const fund = await this.findOne(id, userId);
        if (!fund) {
            throw new NotFoundException('Mutual fund asset not found');
        }

        return this.prisma.mutualFundAsset.update({
            where: { id },
            data: dto,
        });
    }

    async delete(id: string, userId: string) {
        const fund = await this.findOne(id, userId);
        if (!fund) {
            throw new NotFoundException('Mutual fund asset not found');
        }

        await this.prisma.mutualFundAsset.delete({
            where: { id },
        });

        return { success: true, message: 'Mutual fund asset deleted' };
    }
}
