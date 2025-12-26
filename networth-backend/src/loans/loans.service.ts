import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateLoanDto, UpdateLoanDto } from './dto/loan.dto';

@Injectable()
export class LoansService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.loan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.loan.findFirst({
      where: { id, userId },
    });
  }

  async create(userId: string, dto: CreateLoanDto) {
    return this.prisma.loan.create({
      data: {
        userId,
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateLoanDto) {
    const loan = await this.findOne(id, userId);
    if (!loan) {
      throw new Error('Loan not found');
    }

    return this.prisma.loan.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async delete(id: string, userId: string) {
    const loan = await this.findOne(id, userId);
    if (!loan) {
      throw new Error('Loan not found');
    }

    await this.prisma.loan.delete({ where: { id } });
    return { success: true, message: 'Loan deleted' };
  }
}
