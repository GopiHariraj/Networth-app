import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      console.error(
        '⚠️  Database connection failed. Starting in Offline/Mock mode. Features dependent on DB will fail.',
      );
      // Do NOT throw error, allow app to start
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper method to clean database (useful for testing)
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;

    // Order matters due to foreign key constraints
    const models = [
      'auditLog',
      'priceCache',
      'goal',
      'netWorthSnapshot',
      'transaction',
      'category',
      'loan',
      'property',
      'stockAsset',
      'goldAsset',
      'bankAccount',
      'user',
    ];

    // for (const model of models) {
    //     await (this as any)[model].deleteMany({});
    // }
  }
}
