import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { OpenAIService } from '../openai/openai.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { GoldAssetsService } from '../gold-assets/gold-assets.service';
import { StockAssetsService } from '../stock-assets/stock-assets.service';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private openaiService: OpenAIService,
    @Inject(forwardRef(() => GoldAssetsService))
    private goldAssetsService: GoldAssetsService,
    @Inject(forwardRef(() => StockAssetsService))
    private stockAssetsService: StockAssetsService,
  ) {}

  async create(userId: string, dto: CreateTransactionDto) {
    return this.prisma.transaction.create({
      data: {
        amount: dto.amount,
        description: dto.description,
        source: dto.source || 'MANUAL',
        date: dto.date ? new Date(dto.date) : new Date(),
        merchant: dto.merchant,
        type: dto.type || 'EXPENSE',
        userId: userId,
        categoryId: dto.categoryId,
      },
    });
  }

  async parseAndCreate(userId: string, smsText: string) {
    const parsed = await this.openaiService.parseSMS(smsText);

    // Route based on transaction type
    switch (parsed.type) {
      case 'GOLD':
        return this.createGoldAsset(userId, parsed);

      case 'STOCK':
        return this.createStockAsset(userId, parsed);

      case 'BOND':
        return this.createBondAsset(userId, parsed);

      case 'EXPENSE':
      default:
        return this.createExpenseTransaction(userId, parsed);
    }
  }

  private async createGoldAsset(userId: string, parsed: any) {
    // Create gold asset using GoldAssetsService
    const goldData = {
      name: parsed.ornamentName || 'Gold Item',
      weightGrams: parsed.weight || 0,
      purchasePrice: parsed.amount,
      currentValue: parsed.amount,
      purchaseDate: parsed.date.toISOString(),
      notes: `${parsed.purity || '22K'} purity, from SMS`,
    };

    return this.goldAssetsService.create(userId, goldData);
  }

  private async createStockAsset(userId: string, parsed: any) {
    // Create stock asset using StockAssetsService
    const stockData = {
      symbol: parsed.stockSymbol || 'UNKNOWN',
      name: parsed.stockSymbol || 'Unknown Stock',
      exchange: parsed.market || 'NASDAQ',
      quantity: parsed.units || 1,
      avgPrice: parsed.unitPrice || parsed.amount,
      currentPrice: parsed.unitPrice || parsed.amount,
      notes: 'Added via SMS',
    };

    return this.stockAssetsService.create(userId, stockData);
  }

  private async createBondAsset(userId: string, parsed: any) {
    // Bonds are not yet in database - return mock response
    // In future, create BondsService similar to Gold/Stocks
    return {
      type: 'BOND',
      message: 'Bond created in localStorage (not migrated to DB yet)',
      data: {
        bondName: parsed.bondName,
        amount: parsed.amount,
        interestRate: parsed.interestRate,
        maturityDate: parsed.maturityDate,
        source: 'SMS',
      },
    };
  }

  private async createExpenseTransaction(userId: string, parsed: any) {
    // Find or create category
    let categoryId = null;
    if (parsed.category) {
      const category = await this.prisma.category.findFirst({
        where: { userId, name: parsed.category },
      });
      if (category) {
        categoryId = category.id;
      } else {
        const newCat = await this.prisma.category.create({
          data: {
            userId,
            name: parsed.category,
            type: 'EXPENSE',
          },
        });
        categoryId = newCat.id;
      }
    }

    return this.create(userId, {
      amount: parsed.amount,
      merchant: parsed.merchant,
      description: parsed.description,
      source: 'SMS',
      date: new Date().toISOString(),
      categoryId: categoryId || undefined,
      type: 'EXPENSE',
    });
  }

  async findAll(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: 'desc' },
    });
  }

  async getDashboardData(userId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
    });

    const income = transactions
      .filter((t: any) => t.type === 'INCOME')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    const expense = transactions
      .filter((t: any) => t.type === 'EXPENSE')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    const categoryBreakdown: Record<string, number> = {};
    transactions.forEach((t: any) => {
      if (t.type === 'EXPENSE' && t.category) {
        categoryBreakdown[t.category.name] =
          (categoryBreakdown[t.category.name] || 0) + Number(t.amount);
      }
    });

    const pieChartData = Object.entries(categoryBreakdown).map(
      ([name, value]) => ({
        name,
        value,
      }),
    );

    // Monthly Trend (Simple last 6 months)
    // Group by month-year
    // This is a simplified version

    return {
      summary: {
        income,
        expense,
        net: income - expense,
      },
      pieChartData,
      recentTransactions: transactions.slice(0, 5),
    };
  }
}
