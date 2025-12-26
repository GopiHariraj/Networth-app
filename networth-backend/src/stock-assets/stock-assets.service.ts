import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateStockAssetDto,
  UpdateStockAssetDto,
} from './dto/stock-asset.dto';

@Injectable()
export class StockAssetsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.stockAsset.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.stockAsset.findFirst({
      where: { id, userId },
    });
  }

  async create(userId: string, dto: CreateStockAssetDto) {
    return this.prisma.stockAsset.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateStockAssetDto) {
    const asset = await this.findOne(id, userId);
    if (!asset) {
      throw new Error('Stock asset not found');
    }

    return this.prisma.stockAsset.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, userId: string) {
    const asset = await this.findOne(id, userId);
    if (!asset) {
      throw new Error('Stock asset not found');
    }

    await this.prisma.stockAsset.delete({ where: { id } });
    return { success: true, message: 'Stock asset deleted' };
  }
}
