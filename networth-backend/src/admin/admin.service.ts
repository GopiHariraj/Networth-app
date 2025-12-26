import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) { }

  async resetDatabase() {
    // Delete all data from all tables except preserve admin user

    // Get admin user ID to preserve
    const adminUser = await this.prisma.user.findUnique({
      where: { email: 'admin@fortstec.com' },
    });

    if (!adminUser) {
      throw new Error('Admin user not found. Cannot reset database safely.');
    }

    // Count records before deletion
    const counts = {
      bankAccounts: await this.prisma.bankAccount.count(),
      goldAssets: await this.prisma.goldAsset.count(),
      stockAssets: await this.prisma.stockAsset.count(),
      bondAssets: await this.prisma.bondAsset.count(),
      mutualFunds: await this.prisma.mutualFundAsset.count(),
      properties: await this.prisma.property.count(),
      loans: await this.prisma.loan.count(),
      creditCards: await this.prisma.creditCard.count(),
      transactions: await this.prisma.transaction.count(),
      categories: await this.prisma.category.count(),
      budgets: await this.prisma.budget.count(),
      expenses: await this.prisma.expense.count(),
      expenseCategories: await this.prisma.expenseCategory.count(),
      goals: await this.prisma.goal.count(),
      snapshots: await this.prisma.netWorthSnapshot.count(),
      auditLogs: await this.prisma.auditLog.count(),
      users: await this.prisma.user.count({
        where: { id: { not: adminUser.id } },
      }),
    };

    // Delete all records in order (respecting foreign key constraints)
    // Most child tables have onDelete: Cascade, but explicit deletion is safer for counting
    await this.prisma.auditLog.deleteMany({});
    await this.prisma.netWorthSnapshot.deleteMany({});
    await this.prisma.goal.deleteMany({});
    await this.prisma.budget.deleteMany({});
    await this.prisma.transaction.deleteMany({});
    await this.prisma.expense.deleteMany({});
    await this.prisma.bankAccount.deleteMany({});
    await this.prisma.goldAsset.deleteMany({});
    await this.prisma.stockAsset.deleteMany({});
    await this.prisma.bondAsset.deleteMany({});
    await this.prisma.mutualFundAsset.deleteMany({});
    await this.prisma.property.deleteMany({});
    await this.prisma.loan.deleteMany({});
    await this.prisma.creditCard.deleteMany({});
    await this.prisma.category.deleteMany({});
    await this.prisma.expenseCategory.deleteMany({});

    // Delete all users except admin
    await this.prisma.user.deleteMany({
      where: {
        id: { not: adminUser.id },
      },
    });

    return {
      success: true,
      message: 'Database reset successfully',
      deletedRecords: counts,
      preserved: {
        adminUser: adminUser.email,
      },
    };
  }

  async exportData() {
    return {
      users: await this.prisma.user.findMany(),
      bankAccounts: await this.prisma.bankAccount.findMany(),
      goldAssets: await this.prisma.goldAsset.findMany(),
      stockAssets: await this.prisma.stockAsset.findMany(),
      bondAssets: await this.prisma.bondAsset.findMany(),
      mutualFundAssets: await this.prisma.mutualFundAsset.findMany(),
      properties: await this.prisma.property.findMany(),
      loans: await this.prisma.loan.findMany(),
      creditCards: await this.prisma.creditCard.findMany(),
      transactions: await this.prisma.transaction.findMany(),
      categories: await this.prisma.category.findMany(),
      budgets: await this.prisma.budget.findMany(),
      expenses: await this.prisma.expense.findMany(),
      expenseCategories: await this.prisma.expenseCategory.findMany(),
      goals: await this.prisma.goal.findMany(),
      snapshots: await this.prisma.netWorthSnapshot.findMany(),
      auditLogs: await this.prisma.auditLog.findMany(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  async importData(data: any) {
    // 1. Reset database first (preserving admin)
    await this.resetDatabase();

    // 2. Import users (except those that already exist - primarily the admin)
    const existingUsers = await this.prisma.user.findMany();
    const existingEmails = existingUsers.map((u) => u.email);

    const usersToImport = (data.users || []).filter(
      (u: any) => !existingEmails.includes(u.email),
    );

    for (const user of usersToImport) {
      await this.prisma.user.create({ data: user });
    }

    // 3. Import other data
    // We use a simple loop to maintain order if necessary, but most can be batch created
    if (data.expenseCategories)
      await this.prisma.expenseCategory.createMany({
        data: data.expenseCategories,
      });
    if (data.categories)
      await this.prisma.category.createMany({ data: data.categories });
    if (data.bankAccounts)
      await this.prisma.bankAccount.createMany({ data: data.bankAccounts });
    if (data.goldAssets)
      await this.prisma.goldAsset.createMany({ data: data.goldAssets });
    if (data.stockAssets)
      await this.prisma.stockAsset.createMany({ data: data.stockAssets });
    if (data.bondAssets)
      await this.prisma.bondAsset.createMany({ data: data.bondAssets });
    if (data.mutualFundAssets)
      await this.prisma.mutualFundAsset.createMany({
        data: data.mutualFundAssets,
      });
    if (data.properties)
      await this.prisma.property.createMany({ data: data.properties });
    if (data.loans) await this.prisma.loan.createMany({ data: data.loans });
    if (data.creditCards)
      await this.prisma.creditCard.createMany({ data: data.creditCards });
    if (data.transactions)
      await this.prisma.transaction.createMany({ data: data.transactions });
    if (data.budgets)
      await this.prisma.budget.createMany({ data: data.budgets });
    if (data.expenses)
      await this.prisma.expense.createMany({ data: data.expenses });
    if (data.goals) await this.prisma.goal.createMany({ data: data.goals });
    if (data.snapshots)
      await this.prisma.netWorthSnapshot.createMany({ data: data.snapshots });
    if (data.auditLogs)
      await this.prisma.auditLog.createMany({ data: data.auditLogs });

    return { success: true, message: 'Data imported successfully' };
  }
}
