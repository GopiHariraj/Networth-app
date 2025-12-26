import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateBondAssetDto, UpdateBondAssetDto } from './dto/bond-asset.dto';

@Injectable()
export class BondAssetsService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: string) {
        return this.prisma.bondAsset.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, userId: string) {
        return this.prisma.bondAsset.findFirst({
            where: { id, userId },
        });
    }

    async create(userId: string, dto: CreateBondAssetDto) {
        return this.prisma.bondAsset.create({
            data: {
                userId,
                ...dto,
            },
        });
    }

    async update(id: string, userId: string, dto: UpdateBondAssetDto) {
        const bond = await this.findOne(id, userId);
        if (!bond) {
            throw new NotFoundException('Bond asset not found');
        }

        return this.prisma.bondAsset.update({
            where: { id },
            data: dto,
        });
    }

    async delete(id: string, userId: string) {
        const bond = await this.findOne(id, userId);
        if (!bond) {
            throw new NotFoundException('Bond asset not found');
        }

        await this.prisma.bondAsset.delete({
            where: { id },
        });

        return { success: true, message: 'Bond asset deleted' };
    }
}
