import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateBankAccountDto,
  UpdateBankAccountDto,
} from './dto/bank-account.dto';

@Injectable()
export class BankAccountsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.bankAccount.findFirst({
      where: { id, userId },
    });
  }

  async create(userId: string, dto: CreateBankAccountDto) {
    return this.prisma.bankAccount.create({
      data: {
        userId,
        accountName: dto.accountName,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        accountType: dto.accountType,
        balance: dto.balance,
        currency: dto.currency || 'AED',
        isActive: dto.isActive ?? true,
        notes: dto.notes,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateBankAccountDto) {
    // Verify ownership
    const account = await this.findOne(id, userId);
    if (!account) {
      throw new Error('Bank account not found');
    }

    return this.prisma.bankAccount.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, userId: string) {
    // Verify ownership
    const account = await this.findOne(id, userId);
    if (!account) {
      throw new Error('Bank account not found');
    }

    await this.prisma.bankAccount.delete({
      where: { id },
    });

    return { success: true, message: 'Bank account deleted' };
  }
}
