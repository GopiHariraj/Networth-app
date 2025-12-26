import { PrismaClient, CategoryType, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed with demo data...');

    // 1. Ensure Admin User
    let admin = await prisma.user.findUnique({
        where: { email: 'admin@fortstec.com' },
    });

    if (!admin) {
        const hashedPassword = await argon2.hash('Forts@123');
        admin = await prisma.user.create({
            data: {
                email: 'admin@fortstec.com',
                firstName: 'Admin',
                lastName: 'User',
                passwordHash: hashedPassword,
                role: Role.SUPER_ADMIN,
                currency: 'AED',
                isActive: true,
                forceChangePassword: false,
            },
        });
        console.log('✅ Admin user created.');
    } else {
        // Ensure forceChangePassword is false for demo purposes
        admin = await prisma.user.update({
            where: { id: admin.id },
            data: { forceChangePassword: false }
        });
        console.log('✅ Admin user exists (Password reset forced to false).');
    }

    const userId = admin.id;

    // 2. Clear existing data to ensure a clean demo state
    console.log('🧹 Clearing existing data for admin user to avoid duplicates...');
    await prisma.transaction.deleteMany({ where: { userId } });
    await prisma.bankAccount.deleteMany({ where: { userId } });
    await prisma.goldAsset.deleteMany({ where: { userId } });
    await prisma.stockAsset.deleteMany({ where: { userId } });
    await prisma.property.deleteMany({ where: { userId } });
    await prisma.loan.deleteMany({ where: { userId } });
    await prisma.goal.deleteMany({ where: { userId } });
    await prisma.netWorthSnapshot.deleteMany({ where: { userId } });

    // 3. Create Categories
    const categories = [
        { name: 'Salary', type: CategoryType.INCOME },
        { name: 'Freelance', type: CategoryType.INCOME },
        { name: 'Rent', type: CategoryType.EXPENSE },
        { name: 'Groceries', type: CategoryType.EXPENSE },
        { name: 'Shopping', type: CategoryType.EXPENSE },
        { name: 'Utilities', type: CategoryType.EXPENSE },
        { name: 'Dining', type: CategoryType.EXPENSE },
        { name: 'Travel', type: CategoryType.EXPENSE },
        { name: 'Investment', type: CategoryType.EXPENSE },
        { name: 'Entertainment', type: CategoryType.EXPENSE },
        { name: 'Health', type: CategoryType.EXPENSE },
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { userId_name: { userId, name: cat.name } },
            update: { type: cat.type },
            create: { userId, name: cat.name, type: cat.type },
        });
    }

    const dbCategories = await prisma.category.findMany({ where: { userId } });
    const catMap = Object.fromEntries(dbCategories.map(c => [c.name, c.id]));

    // 4. Create Bank Accounts
    console.log('🏦 Creating bank accounts...');
    await prisma.bankAccount.createMany({
        data: [
            { accountName: 'ADCB Savings', bankName: 'ADCB', balance: 85200, accountType: 'Savings', userId, currency: 'AED' },
            { accountName: 'HSBC Current', bankName: 'HSBC', balance: 15400, accountType: 'Current', userId, currency: 'AED' },
            { accountName: 'Salary Account', bankName: 'ENBD', balance: 32000, accountType: 'Current', userId, currency: 'AED' },
        ]
    });

    // 5. Create Assets
    console.log('💰 Creating assets...');
    await prisma.goldAsset.createMany({
        data: [
            { name: 'Gold Bar (100g)', weightGrams: 100, purchasePrice: 22000, currentValue: 28500, userId },
            { name: 'Wedding Jewellery', weightGrams: 45, purchasePrice: 9000, currentValue: 12500, userId },
        ]
    });

    await prisma.stockAsset.createMany({
        data: [
            { symbol: 'AAPL', name: 'Apple Inc.', quantity: 25, avgPrice: 150, currentPrice: 195.50, exchange: 'NASDAQ', userId },
            { symbol: 'MSFT', name: 'Microsoft Corp.', quantity: 15, avgPrice: 310, currentPrice: 375.20, exchange: 'NASDAQ', userId },
            { symbol: 'META', name: 'Meta Platforms', quantity: 30, avgPrice: 210, currentPrice: 340.50, exchange: 'NASDAQ', userId },
            { symbol: 'TSLA', name: 'Tesla, Inc.', quantity: 10, avgPrice: 250, currentPrice: 245.00, exchange: 'NASDAQ', userId },
        ]
    });

    await prisma.property.createMany({
        data: [
            { name: 'Downtown Apartment', location: 'Burj Khalifa District, Dubai', purchasePrice: 1500000, currentValue: 1850000, propertyType: 'Residential', userId },
        ]
    });

    // 6. Create Liabilities
    console.log('💳 Creating liabilities...');
    await prisma.loan.createMany({
        data: [
            { loanType: 'HOME_LOAN', lenderName: 'ADCB', principal: 1200000, outstanding: 1045000, emiAmount: 6800, interestRate: 4.5, startDate: new Date('2022-01-01'), endDate: new Date('2042-01-01'), userId },
            { loanType: 'PERSONAL_LOAN', lenderName: 'HSBC', principal: 150000, outstanding: 92000, emiAmount: 2400, interestRate: 8.5, startDate: new Date('2023-01-01'), endDate: new Date('2028-01-01'), userId },
        ]
    });

    // 7. Create Transactions for last 3 months
    console.log('📊 Creating transactions for last 3 months...');
    const today = new Date();
    for (let i = 0; i < 4; i++) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);

        // Income
        await prisma.transaction.create({
            data: {
                amount: 42000,
                description: `Monthly Salary - ${monthDate.toLocaleString('default', { month: 'short' })}`,
                type: 'INCOME',
                date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 28),
                userId,
                categoryId: catMap['Salary']
            }
        });

        if (Math.random() > 0.5) {
            await prisma.transaction.create({
                data: {
                    amount: 2500,
                    description: 'Freelance Project',
                    type: 'INCOME',
                    date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 15),
                    userId,
                    categoryId: catMap['Freelance']
                }
            });
        }

        // Expenses
        const monthlyExpenses = [
            { amount: 4500, name: 'Groceries', desc: 'Carrefour/Spinneys' },
            { amount: 6800, name: 'Rent', desc: 'Monthly Rent' },
            { amount: 1400, name: 'Utilities', desc: 'DEWA & Wi-Fi' },
            { amount: 2000, name: 'Dining', desc: 'Dining & Takeout' },
            { amount: 1500, name: 'Shopping', desc: 'Lifestyle & Apparel' },
            { amount: 800, name: 'Entertainment', desc: 'Clubs & Movies' },
            { amount: 500, name: 'Travel', desc: 'Uber/Careem' },
        ];

        for (const exp of monthlyExpenses) {
            await prisma.transaction.create({
                data: {
                    amount: exp.amount + (Math.random() * 500),
                    description: exp.desc,
                    type: 'EXPENSE',
                    date: new Date(monthDate.getFullYear(), monthDate.getMonth(), Math.floor(Math.random() * 25) + 1),
                    userId,
                    categoryId: catMap[exp.name]
                }
            });
        }
    }

    // 8. Create Goals
    console.log('🎯 Creating goals...');
    await prisma.goal.createMany({
        data: [
            { name: 'New Car (Model Y)', targetAmount: 220000, currentAmount: 85000, targetDate: new Date('2026-06-30'), priority: 'High', userId },
            { name: 'Retirement Fund', targetAmount: 10000000, currentAmount: 1350000, targetDate: new Date('2045-01-01'), priority: 'Medium', userId },
            { name: 'Euro Trip 2026', targetAmount: 35000, currentAmount: 12000, targetDate: new Date('2026-08-15'), priority: 'Low', userId },
        ]
    });

    // 9. Create Snapshots for last 12 months
    console.log('📈 Creating net worth snapshots...');
    for (let i = 0; i < 12; i++) {
        const snapshotDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const baseNW = 1800000;
        const growth = (11 - i) * 12000;
        const nwValue = baseNW + growth + (Math.random() * 10000);

        await prisma.netWorthSnapshot.create({
            data: {
                userId,
                date: snapshotDate,
                netWorth: nwValue,
                totalAssets: nwValue + 1050000,
                totalLiabilities: 1050000,
            }
        });
    }

    console.log('✅ Demo data seeded successfully.');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
