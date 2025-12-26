"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { financialDataApi } from './api/financial-data';

interface AssetItem {
    id: string;
    [key: string]: any;
}

interface NetWorthData {
    assets: {
        gold: { items: AssetItem[]; totalValue: number };
        bonds: { items: AssetItem[]; totalValue: number };
        stocks: { items: AssetItem[]; totalValue: number };
        property: { items: AssetItem[]; totalValue: number };
        mutualFunds: { items: AssetItem[]; totalValue: number };
        cash: {
            bankAccounts: AssetItem[];
            wallets: AssetItem[];
            totalBank: number;
            totalWallet: number;
            totalCash: number;
        };
    };
    liabilities: {
        loans: { items: AssetItem[]; totalValue: number };
        creditCards: { items: AssetItem[]; totalValue: number };
    };
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    lastUpdated: string;
}

interface NetWorthContextType {
    data: NetWorthData;
    updateGold: (items: AssetItem[]) => Promise<void>;
    updateBonds: (items: AssetItem[]) => void;
    updateStocks: (items: AssetItem[]) => Promise<void>;
    updateProperty: (items: AssetItem[]) => Promise<void>;
    updateMutualFunds: (items: AssetItem[]) => void;
    updateCash: (bankAccounts: AssetItem[], wallets: AssetItem[]) => Promise<void>;
    updateLoans: (items: AssetItem[]) => Promise<void>;
    updateCreditCards: (items: AssetItem[]) => void;
    refreshNetWorth: () => Promise<void>;
    resetNetWorth: () => void;
    isLoading: boolean;
}

const NetWorthContext = createContext<NetWorthContextType | undefined>(undefined);

export function NetWorthProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [data, setData] = useState<NetWorthData>({
        assets: {
            gold: { items: [], totalValue: 0 },
            bonds: { items: [], totalValue: 0 },
            stocks: { items: [], totalValue: 0 },
            property: { items: [], totalValue: 0 },
            mutualFunds: { items: [], totalValue: 0 },
            cash: {
                bankAccounts: [],
                wallets: [],
                totalBank: 0,
                totalWallet: 0,
                totalCash: 0
            }
        },
        liabilities: {
            loans: { items: [], totalValue: 0 },
            creditCards: { items: [], totalValue: 0 }
        },
        totalAssets: 0,
        totalLiabilities: 0,
        netWorth: 0,
        lastUpdated: new Date().toISOString()
    });

    // Load data from database via APIs
    const loadData = async () => {
        try {
            setIsLoading(true);

            // Check if user is authenticated
            const token = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');

            if (!token || !savedUser) {
                // User not logged in, skip data loading
                setIsLoading(false);
                return;
            }

            // Parse user to get user ID
            let userId: string | null = null;
            try {
                const user = JSON.parse(savedUser);
                userId = user.id;

                // ALWAYS reset data before loading to prevent flash of old data
                // This ensures clean slate for every data fetch
                console.log('[NetWorth] Resetting data before loading...', { userId });
                setData({
                    assets: {
                        gold: { items: [], totalValue: 0 },
                        bonds: { items: [], totalValue: 0 },
                        stocks: { items: [], totalValue: 0 },
                        property: { items: [], totalValue: 0 },
                        mutualFunds: { items: [], totalValue: 0 },
                        cash: {
                            bankAccounts: [],
                            wallets: [],
                            totalBank: 0,
                            totalWallet: 0,
                            totalCash: 0
                        }
                    },
                    liabilities: {
                        loans: { items: [], totalValue: 0 },
                        creditCards: { items: [], totalValue: 0 }
                    },
                    totalAssets: 0,
                    totalLiabilities: 0,
                    netWorth: 0,
                    lastUpdated: new Date().toISOString()
                });

                setCurrentUserId(userId);
            } catch (e) {
                console.error('Error parsing user:', e);
                setIsLoading(false);
                return;
            }

            // Fetch all financial data from APIs in parallel
            const [
                goldRes,
                stocksRes,
                propertyRes,
                bankAccountsRes,
                loansRes,
                bondsRes,
                mutualFundsRes,
                creditCardsRes,
            ] = await Promise.all([
                financialDataApi.goldAssets.getAll().catch(() => ({ data: [] })),
                financialDataApi.stockAssets.getAll().catch(() => ({ data: [] })),
                financialDataApi.properties.getAll().catch(() => ({ data: [] })),
                financialDataApi.bankAccounts.getAll().catch(() => ({ data: [] })),
                financialDataApi.loans.getAll().catch(() => ({ data: [] })),
                financialDataApi.bondAssets.getAll().catch(() => ({ data: [] })),
                financialDataApi.mutualFunds.getAll().catch(() => ({ data: [] })),
                financialDataApi.creditCards.getAll().catch(() => ({ data: [] })),
            ]);

            const gold = (goldRes.data || []).map((item: any) => ({
                id: item.id,
                ornamentName: item.name,
                grams: parseFloat(item.weightGrams),
                pricePerGram: parseFloat(item.purchasePrice),
                totalValue: parseFloat(item.currentValue),
                purchaseDate: item.purchaseDate || new Date().toISOString(),
                purity: item.notes?.split(' ')[0] || '24K',
                imageUrl: item.imageUrl
            }));

            const stocks = (stocksRes.data || []).map((item: any) => ({
                id: item.id,
                market: item.exchange,
                stockName: item.name,
                units: parseFloat(item.quantity),
                unitPrice: parseFloat(item.currentPrice),
                totalValue: parseFloat(item.quantity) * parseFloat(item.currentPrice),
                purchaseDate: item.createdAt
            }));

            const property = (propertyRes.data || []).map((item: any) => ({
                id: item.id,
                propertyName: item.name,
                location: item.location,
                address: item.address || '',
                purchasePrice: parseFloat(item.purchasePrice),
                currentValue: parseFloat(item.currentValue),
                propertyType: item.propertyType,
                purchaseDate: item.purchaseDate || new Date().toISOString(),
                area: item.area ? parseFloat(item.area) : 0,
                imageUrl: item.imageUrl
            }));

            // const bankAccounts = bankAccountsRes.data || [];

            const loans = (loansRes.data || []).map((item: any) => ({
                id: item.id,
                lenderName: item.lenderName,
                linkedProperty: item.loanType,
                originalAmount: parseFloat(item.principal),
                outstandingBalance: parseFloat(item.outstanding),
                emiAmount: parseFloat(item.emiAmount),
                interestRate: parseFloat(item.interestRate),
                loanStartDate: item.startDate,
                loanEndDate: item.endDate,
                notes: item.notes || '',
                emiDueDate: 1 // Default if not in backend
            }));

            const bonds = (bondsRes.data || []).map((item: any) => ({
                id: item.id,
                name: item.name,
                issuer: item.issuer,
                faceValue: parseFloat(item.faceValue),
                currentValue: parseFloat(item.currentValue),
                interestRate: parseFloat(item.interestRate),
                maturityDate: item.maturityDate,
                notes: item.notes
            }));

            const mutualFunds = (mutualFundsRes.data || []).map((item: any) => ({
                id: item.id,
                name: item.name,
                fundHouse: item.fundHouse,
                units: parseFloat(item.units),
                avgNav: parseFloat(item.avgNav),
                currentNav: parseFloat(item.currentNav),
                currentValue: parseFloat(item.currentValue),
                notes: item.notes
            }));

            // For now wallets are bank accounts of type 'Wallet'
            const allBankRes = (bankAccountsRes.data || []).map((item: any) => ({
                ...item,
                balance: parseFloat(item.balance) || 0
            }));
            const bankAccounts = allBankRes.filter((a: any) => a.accountType !== 'Wallet');
            const wallets = allBankRes.filter((a: any) => a.accountType === 'Wallet');

            const cards = (creditCardsRes.data || []).map((item: any) => ({
                id: item.id,
                cardName: item.cardName,
                bankName: item.bankName,
                creditLimit: parseFloat(item.creditLimit),
                usedAmount: parseFloat(item.usedAmount),
                dueDate: item.dueDate,
                interestRate: item.interestRate,
                notes: item.notes
            }));

            // Calculate totals
            const goldTotal = gold.reduce((sum: number, item: any) => sum + (item.totalValue || 0), 0);
            const bondsTotal = bonds.reduce((sum: number, item: any) => sum + (parseFloat(item.currentValue) || parseFloat(item.faceValue) || 0), 0);
            const stocksTotal = stocks.reduce((sum: number, item: any) => sum + (item.totalValue || 0), 0);
            const propertyTotal = property.reduce((sum: number, item: any) => sum + (item.currentValue || 0), 0);
            const mutualFundsTotal = mutualFunds.reduce((sum: number, item: any) => sum + (parseFloat(item.currentValue) || 0), 0);
            const bankTotal = bankAccounts.reduce((sum: number, item: any) => sum + (parseFloat(item.balance) || 0), 0);
            const walletTotal = wallets.reduce((sum: number, item: any) => sum + (parseFloat(item.balance) || 0), 0);
            const cashTotal = bankTotal + walletTotal;
            const loansTotal = loans.reduce((sum: number, item: any) => sum + (item.outstandingBalance || 0), 0);
            const cardsTotal = cards.reduce((sum: number, item: any) => sum + (parseFloat(item.usedAmount) || 0), 0);

            const totalAssets = goldTotal + bondsTotal + stocksTotal + propertyTotal + mutualFundsTotal + cashTotal;
            const totalLiabilities = loansTotal + cardsTotal;
            const netWorth = totalAssets - totalLiabilities;

            setData({
                assets: {
                    gold: { items: gold, totalValue: goldTotal },
                    bonds: { items: bonds, totalValue: bondsTotal },
                    stocks: { items: stocks, totalValue: stocksTotal },
                    property: { items: property, totalValue: propertyTotal },
                    mutualFunds: { items: mutualFunds, totalValue: mutualFundsTotal },
                    cash: {
                        bankAccounts,
                        wallets,
                        totalBank: bankTotal,
                        totalWallet: walletTotal,
                        totalCash: cashTotal
                    }
                },
                liabilities: {
                    loans: { items: loans, totalValue: loansTotal },
                    creditCards: { items: cards, totalValue: cardsTotal }
                },
                totalAssets,
                totalLiabilities,
                netWorth,
                lastUpdated: new Date().toISOString()
            });

            // Update active goal with current net worth using user-scoped key
            if (userId) {
                const activeGoalKey = `activeGoal_${userId}`;
                const activeGoal = localStorage.getItem(activeGoalKey);
                if (activeGoal) {
                    try {
                        const goal = JSON.parse(activeGoal);
                        goal.currentNetWorth = netWorth;
                        localStorage.setItem(activeGoalKey, JSON.stringify(goal));
                    } catch (e) {
                        console.error('Error updating active goal', e);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading financial data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []); // Initial load

    // Watch for user changes (login/logout)
    useEffect(() => {
        const checkUserChange = () => {
            const savedUser = localStorage.getItem('user');
            const token = localStorage.getItem('token');

            if (savedUser && token) {
                try {
                    const user = JSON.parse(savedUser);
                    const userId = user.id;

                    // If user changed, reload data
                    if (userId !== currentUserId) {
                        console.log('[NetWorth] User changed, reloading data...', { old: currentUserId, new: userId });
                        loadData();
                    }
                } catch (e) {
                    console.error('Error checking user change:', e);
                }
            } else if (currentUserId !== null && !token) {
                // User logged out, reset data
                console.log('[NetWorth] User logged out, resetting data...');
                resetNetWorth();
            }
        };

        // Check on interval (every 500ms)
        const interval = setInterval(checkUserChange, 500);

        return () => clearInterval(interval);
    }, [currentUserId]);

    const updateGold = async (items: AssetItem[]) => {
        // Gold is now stored in the database - no localStorage needed
        await loadData();
    };

    const updateBonds = async (items: AssetItem[]) => {
        // Bonds are now stored in the database
        await loadData();
    };

    const updateStocks = async (items: AssetItem[]) => {
        // Stocks are now stored in the database
        await loadData();
    };

    const updateProperty = async (items: AssetItem[]) => {
        // Property is now stored in the database
        await loadData();
    };

    const updateMutualFunds = async (items: AssetItem[]) => {
        // Mutual funds are now stored in the database
        await loadData();
    };

    const updateCash = async (bankAccounts: AssetItem[], wallets: AssetItem[]) => {
        // Bank accounts and wallets are now stored in the database
        await loadData();
    };

    const updateLoans = async (items: AssetItem[]) => {
        // Loans are now stored in the database
        await loadData();
    };

    const updateCreditCards = async (items: AssetItem[]) => {
        // Credit cards are now stored in the database
        await loadData();
    };

    const refreshNetWorth = async () => {
        await loadData();
    };

    const resetNetWorth = () => {
        setData({
            assets: {
                gold: { items: [], totalValue: 0 },
                bonds: { items: [], totalValue: 0 },
                stocks: { items: [], totalValue: 0 },
                property: { items: [], totalValue: 0 },
                mutualFunds: { items: [], totalValue: 0 },
                cash: {
                    bankAccounts: [],
                    wallets: [],
                    totalBank: 0,
                    totalWallet: 0,
                    totalCash: 0
                }
            },
            liabilities: {
                loans: { items: [], totalValue: 0 },
                creditCards: { items: [], totalValue: 0 }
            },
            totalAssets: 0,
            totalLiabilities: 0,
            netWorth: 0,
            lastUpdated: new Date().toISOString()
        });
        setCurrentUserId(null);
    };

    return (
        <NetWorthContext.Provider value={{
            data,
            updateGold,
            updateBonds,
            updateStocks,
            updateProperty,
            updateMutualFunds,
            updateCash,
            updateLoans,
            updateCreditCards,
            refreshNetWorth,
            resetNetWorth,
            isLoading
        }}>
            {children}
        </NetWorthContext.Provider>
    );
}

export function useNetWorth() {
    const context = useContext(NetWorthContext);
    if (context === undefined) {
        throw new Error('useNetWorth must be used within a NetWorthProvider');
    }
    return context;
}
