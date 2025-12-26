import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.property.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.property.findFirst({
      where: { id, userId },
    });
  }

  async create(userId: string, dto: CreatePropertyDto) {
    return this.prisma.property.create({
      data: {
        userId,
        ...dto,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdatePropertyDto) {
    const property = await this.findOne(id, userId);
    if (!property) {
      throw new Error('Property not found');
    }

    return this.prisma.property.update({
      where: { id },
      data: {
        ...dto,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
      },
    });
  }

  async delete(id: string, userId: string) {
    const property = await this.findOne(id, userId);
    if (!property) {
      throw new Error('Property not found');
    }

    await this.prisma.property.delete({ where: { id } });
    return { success: true, message: 'Property deleted' };
  }
}
