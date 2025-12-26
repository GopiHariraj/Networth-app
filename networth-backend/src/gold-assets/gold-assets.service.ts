import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateGoldAssetDto, UpdateGoldAssetDto } from './dto/gold-asset.dto';

@Injectable()
export class GoldAssetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.goldAsset.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.goldAsset.findFirst({
      where: { id, userId },
    });
  }

  async create(userId: string, dto: CreateGoldAssetDto) {
    return this.prisma.goldAsset.create({
      data: {
        userId,
        ...dto,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateGoldAssetDto) {
    const asset = await this.findOne(id, userId);
    if (!asset) {
      throw new Error('Gold asset not found');
    }

    return this.prisma.goldAsset.update({
      where: { id },
      data: {
        ...dto,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
      },
    });
  }

  async delete(id: string, userId: string) {
    const asset = await this.findOne(id, userId);
    if (!asset) {
      throw new Error('Gold asset not found');
    }

    await this.prisma.goldAsset.delete({ where: { id } });
    return { success: true, message: 'Gold asset deleted' };
  }
}
