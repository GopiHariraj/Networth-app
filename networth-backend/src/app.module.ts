import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransactionsModule } from './transactions/transactions.module';
import { OpenAIModule } from './openai/openai.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { AiModule } from './ai/ai.module';
import { UsersModule } from './users/users.module';
import { ExpensesModule } from './expenses/expenses.module';
import { AdminModule } from './admin/admin.module';
import { BankAccountsModule } from './bank-accounts/bank-accounts.module';
import { GoldAssetsModule } from './gold-assets/gold-assets.module';
import { LoansModule } from './loans/loans.module';
import { PropertiesModule } from './properties/properties.module';
import { StockAssetsModule } from './stock-assets/stock-assets.module';
import { CreditCardsModule } from './credit-cards/credit-cards.module';
import { GoalsModule } from './goals/goals.module';
import { BondAssetsModule } from './bond-assets/bond-assets.module';
import { MutualFundAssetsModule } from './mutual-fund-assets/mutual-fund-assets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    TransactionsModule,
    OpenAIModule,
    AiModule,
    UsersModule,
    ExpensesModule,
    AdminModule,
    BankAccountsModule,
    GoldAssetsModule,
    LoansModule,
    PropertiesModule,
    StockAssetsModule,
    CreditCardsModule,
    GoalsModule,
    BondAssetsModule,
    MutualFundAssetsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
