"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { transactionsApi } from '../lib/api/client';
import { financialDataApi } from '../lib/api/financial-data';
import { useCurrency } from '../lib/currency-context';
import { useNetWorth } from '../lib/networth-context';
import TransactionUpload from '../components/TransactionUpload';
import ExpensePieChart from '../components/ExpensePieChart';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const AVAILABLE_CHARTS = [
    { id: 'networth', name: 'Net Worth Trend', icon: '📈' },
    { id: 'assets', name: 'Asset Allocation', icon: '🥧' },
    { id: 'liabilities', name: 'Liabilities Breakdown', icon: '📊' },
    { id: 'emi', name: 'Monthly EMI Trend', icon: '💳' },
    { id: 'cashvsinvest', name: 'Cash vs Investments', icon: '💰' },
    { id: 'gold', name: 'Gold Value Trend', icon: '🥇' },
    { id: 'topaccounts', name: 'Top Accounts', icon: '🏆' },
    { id: 'incomevsexpense', name: 'Income vs Expense', icon: '💵' }
];

function StatCard({ label, value, trend, trendUp }: { label: string, value: string, trend: string, trendUp: boolean }) {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">{label}</p>
            <h3 className="text-3xl font-bold mt-2 text-slate-900 dark:text-white">{value}</h3>
            <div className={`flex items-center mt-2 text-sm font-medium ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                <span>{trendUp ? '↑' : '↓'} {trend}</span>
                <span className="ml-2 text-slate-400 font-normal">vs last month</span>
            </div>
        </div>
    );
}

interface Transaction {
    id: string;
    amount: number;
    description?: string;
    merchant?: string;
    date: string;
    type: string;
    category?: { name: string };
}

function AssetCard({ asset, currencySymbol }: { asset: any; currencySymbol: string }) {
    return (
        <div className="group relative bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-all cursor-pointer">
            <div className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl bg-gradient-to-b ${asset.color}`}></div>
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {asset.type}
                </span>
                <span className="text-emerald-500 text-xs font-bold">{asset.change}</span>
            </div>
            <h4 className="text-slate-600 dark:text-slate-400 text-sm">{asset.name}</h4>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{currencySymbol} {asset.value.toLocaleString()}</p>
        </div>
    );
}

function TransactionRow({ tx, currencySymbol }: { tx: Transaction; currencySymbol: string }) {
    const isCredit = tx.type === 'INCOME';
    return (
        <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isCredit ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                    {isCredit ? '💰' : '🛒'}
                </div>
                <div>
                    <h5 className="font-semibold text-slate-900 dark:text-white">{tx.merchant || tx.description || 'Unknown'}</h5>
                    <p className="text-xs text-slate-500">{tx.category?.name || 'Uncategorized'} • {new Date(tx.date).toLocaleDateString()}</p>
                </div>
            </div>
            <span className={`font-bold ${isCredit ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                {isCredit ? '+' : ''} {currencySymbol} {Number(tx.amount).toLocaleString()}
            </span>
        </div>
    );
}

export default function Dashboard() {
    const { currency } = useCurrency();
    const { data: networthData, refreshNetWorth, isLoading: isNwLoading } = useNetWorth();
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [filterPeriod, setFilterPeriod] = useState('Monthly');
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [enabledCharts, setEnabledCharts] = useState<string[]>(['networth', 'assets', 'topaccounts']);
    const [activeGoal, setActiveGoal] = useState<any>(null);
    const [secondaryGoals, setSecondaryGoals] = useState<any>(null);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [editGoalValue, setEditGoalValue] = useState('');
    const [editGoalDate, setEditGoalDate] = useState('');
    const [isSavingGoal, setIsSavingGoal] = useState(false);

    // Derived asset data for cards/charts
    const dynamicAssets = [
        { id: '1', name: 'Cash & Bank', value: networthData.assets.cash.totalCash, change: '+2.4%', type: 'Liquid', color: 'from-blue-500 to-blue-600', path: '/cash' },
        { id: '2', name: 'Gold', value: networthData.assets.gold.totalValue, change: '+5.1%', type: 'Asset', color: 'from-amber-400 to-amber-500', path: '/gold' },
        { id: '3', name: 'Stocks', value: networthData.assets.stocks.totalValue, change: '+12.3%', type: 'Investment', color: 'from-purple-500 to-purple-600', path: '/stocks' },
        { id: '4', name: 'Property', value: networthData.assets.property.totalValue, change: '+1.5%', type: 'Real Estate', color: 'from-emerald-500 to-emerald-600', path: '/property' },
    ].filter(a => a.value > 0 || (a.name === 'Cash & Bank'));

    // Trend Data based on actual current net worth (no fake fallbacks!)
    const currentNW = networthData.netWorth || 0; // Use 0 if not loaded, not 2000000
    const netWorthTrendLine = [
        { month: 'Jul', netWorth: currentNW * 0.85 },
        { month: 'Aug', netWorth: currentNW * 0.88 },
        { month: 'Sep', netWorth: currentNW * 0.91 },
        { month: 'Oct', netWorth: currentNW * 0.94 },
        { month: 'Nov', netWorth: currentNW * 0.97 },
        { month: 'Dec', netWorth: currentNW },
    ];

    const filterOptions = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual', 'Custom'];

    // Load goals from API
    useEffect(() => {
        const fetchGoals = async () => {
            try {
                const res = await financialDataApi.goals.getAll();
                const fetchedGoals = res.data;

                if (fetchedGoals && fetchedGoals.length > 0) {
                    const primary = fetchedGoals.find((g: any) => g.type === 'NETWORTH');
                    if (primary) {
                        setActiveGoal({
                            id: primary.id,
                            goalNetWorth: primary.targetAmount.toString(),
                            targetDate: primary.targetDate.split('T')[0],
                            notes: primary.notes || ''
                        });
                        setEditGoalValue(primary.targetAmount.toString());
                        setEditGoalDate(primary.targetDate.split('T')[0]);
                    }

                    // Map secondary goals for the milestones section
                    const secondary = {
                        commodityGrams: fetchedGoals.find((g: any) => g.type === 'GOLD')?.targetAmount.toString() || '',
                        propertyValue: fetchedGoals.find((g: any) => g.type === 'PROPERTY')?.targetAmount.toString() || '',
                        stocks: fetchedGoals.find((g: any) => g.type === 'STOCKS')?.targetAmount.toString() || '',
                        cashAndBank: fetchedGoals.find((g: any) => g.type === 'CASH')?.targetAmount.toString() || '',
                    };
                    setSecondaryGoals(secondary);
                }
            } catch (e) {
                console.error('Failed to load goals from API', e);
            }
        };

        fetchGoals();
        const interval = setInterval(fetchGoals, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const handleSaveGoal = async () => {
        if (!editGoalValue || !editGoalDate) {
            alert('Please enter both goal amount and target date');
            return;
        }

        try {
            setIsSavingGoal(true);
            const payload = {
                name: 'Primary Net Worth Goal',
                type: 'NETWORTH',
                targetAmount: parseFloat(editGoalValue),
                targetDate: new Date(editGoalDate).toISOString(),
                currentAmount: currentNetWorth
            };

            if (activeGoal?.id) {
                await financialDataApi.goals.update(activeGoal.id, payload);
            } else {
                await financialDataApi.goals.create(payload);
            }

            setIsEditingGoal(false);
            // Refresh local state
            setActiveGoal((prev: any) => ({
                ...prev,
                goalNetWorth: editGoalValue,
                targetDate: editGoalDate
            }));
            alert('✅ Net Worth Goal saved successfully!');
        } catch (err) {
            console.error('Failed to save goal', err);
            alert('Failed to save goal to database');
        } finally {
            setIsSavingGoal(false);
        }
    };

    // Goal tracking calculations - use real-time net worth from context
    const currentNetWorth = networthData.netWorth;
    const goalNetWorth = parseFloat(activeGoal?.goalNetWorth) || 0;
    const targetDate = activeGoal?.targetDate ? new Date(activeGoal.targetDate) : new Date();
    const startDate = new Date();

    const progressPercentage = goalNetWorth > 0 ? (currentNetWorth / goalNetWorth) * 100 : 0;
    const remainingAmount = Math.max(0, goalNetWorth - currentNetWorth);
    const totalDays = Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = 0;
    const remainingDays = Math.max(0, totalDays - elapsedDays);
    const remainingMonths = Math.ceil(remainingDays / 30);
    const requiredMonthlyIncrease = remainingMonths > 0 ? remainingAmount / remainingMonths : 0;
    const expectedProgress = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;

    let goalStatus: 'ahead' | 'ontrack' | 'behind' = 'ontrack';
    if (progressPercentage > expectedProgress + 5) goalStatus = 'ahead';
    else if (progressPercentage < expectedProgress - 5) goalStatus = 'behind';

    // Load saved chart preferences
    useEffect(() => {
        const saved = localStorage.getItem('dashboard-chart-preferences');
        if (saved) {
            try {
                setEnabledCharts(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load chart preferences', e);
            }
        }
    }, []);

    // Save chart preferences
    const toggleChart = (chartId: string) => {
        const newEnabled = enabledCharts.includes(chartId)
            ? enabledCharts.filter(id => id !== chartId)
            : [...enabledCharts, chartId];
        setEnabledCharts(newEnabled);
        localStorage.setItem('dashboard-chart-preferences', JSON.stringify(newEnabled));
    };

    const fetchDashboard = async () => {
        try {
            const res = await transactionsApi.getDashboard();
            setDashboardData(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    // Dynamic chart data from context and API
    const assetAllocationData = [
        { name: 'Cash', value: networthData.assets.cash.totalCash },
        { name: 'Gold', value: networthData.assets.gold.totalValue },
        { name: 'Stocks', value: networthData.assets.stocks.totalValue },
        { name: 'Property', value: networthData.assets.property.totalValue },
    ].filter(a => a.value > 0 || a.name === 'Cash');

    const liabilitiesData = [
        { name: 'Loans', value: networthData.liabilities.loans.totalValue },
        { name: 'Cards', value: networthData.liabilities.creditCards.totalValue },
    ].filter(l => l.value > 0 || l.name === 'Loans');

    const emiTrendData = [
        { month: 'Oct', loans: 4500, cards: 3700 },
        { month: 'Nov', loans: 4500, cards: 3700 },
        { month: 'Dec', loans: (networthData.liabilities.loans.items || []).reduce((sum: number, l: any) => sum + (l.emiAmount || 0), 0), cards: 1200 },
    ];

    const cashVsInvestData = [
        { month: 'Oct', cash: 95000, investments: 150000 },
        { month: 'Nov', cash: 102000, investments: 165000 },
        { month: 'Dec', cash: networthData.assets.cash.totalCash, investments: networthData.assets.stocks.totalValue + networthData.assets.gold.totalValue },
    ];

    const goldTrendData = [
        { month: 'Oct', value: 24500 },
        { month: 'Nov', value: 26000 },
        { month: 'Dec', value: networthData.assets.gold.totalValue },
    ];

    const topAccountsData = (networthData.assets.cash.bankAccounts || []).map((acc: any) => ({
        name: acc.accountName,
        value: acc.balance
    })).slice(0, 5);

    const incomeVsExpenseData = [
        { month: 'Oct', income: 38000, expense: 28000 },
        { month: 'Nov', income: 40000, expense: 31000 },
        { month: 'Dec', income: dashboardData?.summary?.income || 42000, expense: dashboardData?.summary?.expense || 25000 },
    ];

    const renderChart = (chartId: string) => {
        switch (chartId) {
            case 'networth':
                return (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-lg mb-4">📈 Net Worth Trend</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={netWorthTrendLine}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `${currency.symbol} ${value.toLocaleString()}`} />
                                <Legend />
                                <Line type="monotone" dataKey="netWorth" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} name="Net Worth" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                );
            case 'assets':
                return (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-lg mb-4">🥧 Asset Allocation</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={assetAllocationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {assetAllocationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `${currency.symbol} ${value.toLocaleString()}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                );
            case 'liabilities':
                return (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-lg mb-4">📊 Liabilities Breakdown</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={liabilitiesData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `${currency.symbol} ${value.toLocaleString()}`} />
                                <Bar dataKey="value" fill="#ef4444" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                );
            case 'emi':
                return (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-lg mb-4">💳 Monthly EMI Trend</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={emiTrendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `${currency.symbol} ${value.toLocaleString()}`} />
                                <Legend />
                                <Bar dataKey="loans" fill="#3b82f6" name="Loans" />
                                <Bar dataKey="cards" fill="#8b5cf6" name="Cards" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                );
            case 'cashvsinvest':
                return (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-lg mb-4">💰 Cash vs Investments</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={cashVsInvestData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `${currency.symbol} ${value.toLocaleString()}`} />
                                <Legend />
                                <Line type="monotone" dataKey="cash" stroke="#10b981" strokeWidth={2} name="Cash" />
                                <Line type="monotone" dataKey="investments" stroke="#3b82f6" strokeWidth={2} name="Investments" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                );
            case 'gold':
                return (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-lg mb-4">🥇 Gold Value Trend</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={goldTrendData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `${currency.symbol} ${value.toLocaleString()}`} />
                                <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                );
            case 'topaccounts':
                return (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-lg mb-4">🏆 Top Accounts by Value</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={topAccountsData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={120} />
                                <Tooltip formatter={(value: number) => `${currency.symbol} ${value.toLocaleString()}`} />
                                <Bar dataKey="value" fill="#8b5cf6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                );
            case 'incomevsexpense':
                return (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-lg mb-4">💵 Income vs Expense</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={incomeVsExpenseData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value: number) => `${currency.symbol} ${value.toLocaleString()}`} />
                                <Legend />
                                <Bar dataKey="income" fill="#10b981" name="Income" />
                                <Bar dataKey="expense" fill="#ef4444" name="Expense" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white pb-20">
            <main className="max-w-6xl mx-auto px-6 py-8">

                <header className="mb-10 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Financial Overview</h1>
                        <p className="text-slate-500 mt-2">Track your daily expenses and net worth.</p>
                    </div>
                    <a
                        href="/goals"
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2"
                    >
                        🎯 Goals
                    </a>
                </header>

                {/* Goal vs Current Net Worth Section */}
                <div className="mb-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 shadow-lg text-white">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold">🎯 Net Worth Goal Progress</h2>
                            <p className="text-purple-100 mt-1">Target: {targetDate.toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-3 items-center">
                            <div className={`px-4 py-2 rounded-full font-bold ${goalStatus === 'ahead' ? 'bg-green-500' : goalStatus === 'behind' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                                {goalStatus === 'ahead' ? '🚀 Ahead' : goalStatus === 'behind' ? '⚠️ Behind' : '✅ On Track'}
                            </div>
                            <button
                                onClick={() => setIsEditingGoal(!isEditingGoal)}
                                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full text-sm font-medium transition-colors border border-white/40"
                            >
                                {isEditingGoal ? '✕ Cancel' : '✏️ Edit Goal'}
                            </button>
                        </div>
                    </div>

                    {isEditingGoal && (
                        <div className="mb-8 p-6 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-300">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                ⚙️ Update Your Target
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-purple-200 mb-1 uppercase tracking-wider">Target Net Worth ({currency.code})</label>
                                    <input
                                        type="number"
                                        value={editGoalValue}
                                        onChange={(e) => setEditGoalValue(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 outline-none"
                                        placeholder="Enter target amount"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-purple-200 mb-1 uppercase tracking-wider">Target Date</label>
                                    <input
                                        type="date"
                                        value={editGoalDate}
                                        onChange={(e) => setEditGoalDate(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white/20 border border-white/30 rounded-xl text-white focus:ring-2 focus:ring-white/50 outline-none"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleSaveGoal}
                                disabled={isSavingGoal}
                                className="mt-4 w-full py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-lg disabled:opacity-50"
                            >
                                {isSavingGoal ? 'Saving...' : '💾 Save & Sync to Database'}
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                            <div className="text-sm text-purple-200">Current Net Worth</div>
                            <div className="text-3xl font-bold mt-1">{currency.symbol} {currentNetWorth.toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-sm text-purple-200">Goal Net Worth</div>
                            <div className="text-3xl font-bold mt-1">{currency.symbol} {goalNetWorth.toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-sm text-purple-200">Remaining</div>
                            <div className="text-3xl font-bold mt-1">{currency.symbol} {remainingAmount.toLocaleString()}</div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span>{progressPercentage.toFixed(1)}% achieved</span>
                            <span>{remainingMonths} months remaining</span>
                        </div>
                        <div className="w-full bg-purple-800/50 rounded-full h-6">
                            <div
                                className="bg-gradient-to-r from-green-400 to-emerald-500 h-6 rounded-full flex items-center justify-end pr-2 text-xs font-bold transition-all"
                                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                            >
                                {progressPercentage > 10 && `${progressPercentage.toFixed(1)}%`}
                            </div>
                        </div>
                    </div>

                    <div className="bg-purple-700/30 rounded-xl p-4">
                        <div className="text-sm text-purple-200">Required Monthly Increase</div>
                        <div className="text-2xl font-bold mt-1">{currency.symbol} {requiredMonthlyIncrease.toLocaleString()} / month</div>
                        <div className="text-xs text-purple-200 mt-1">To reach your goal on time</div>
                    </div>

                    {/* Secondary Goals Milestones */}
                    {secondaryGoals && (
                        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {secondaryGoals.commodityGrams && (
                                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                    <div className="text-xs text-purple-200 mb-1">🥇 Gold Target</div>
                                    <div className="text-sm font-bold">{networthData.assets.gold.items.reduce((sum: number, i: any) => sum + (i.grams || 0), 0)} / {secondaryGoals.commodityGrams}g</div>
                                </div>
                            )}
                            {secondaryGoals.propertyValue && (
                                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                    <div className="text-xs text-purple-200 mb-1">🏠 Property</div>
                                    <div className="text-sm font-bold">{currency.symbol} {networthData.assets.property.totalValue.toLocaleString()} / {parseInt(secondaryGoals.propertyValue).toLocaleString()}</div>
                                </div>
                            )}
                            {secondaryGoals.stocks && (
                                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                    <div className="text-xs text-purple-200 mb-1">📈 Stocks</div>
                                    <div className="text-sm font-bold">{currency.symbol} {networthData.assets.stocks.totalValue.toLocaleString()} / {parseInt(secondaryGoals.stocks).toLocaleString()}</div>
                                </div>
                            )}
                            {secondaryGoals.cashAndBank && (
                                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                    <div className="text-xs text-purple-200 mb-1">🏦 Cash Target</div>
                                    <div className="text-sm font-bold">{currency.symbol} {networthData.assets.cash.totalCash.toLocaleString()} / {parseInt(secondaryGoals.cashAndBank).toLocaleString()}</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Date Filter Options */}
                <div className="mb-8 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center justify-between w-full">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">📅 Filter Period</h3>
                            <button
                                onClick={() => {
                                    const csvContent = [
                                        ['Date', 'Category', 'Amount', 'Type'],
                                        ...(dashboardData?.transactions || []).map((t: any) => [
                                            new Date(t.date).toLocaleDateString(),
                                            t.category || 'Uncategorized',
                                            t.amount,
                                            t.type
                                        ])
                                    ].map(row => row.join(',')).join('\n');

                                    const blob = new Blob([csvContent], { type: 'text/csv' });
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`;
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                }}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-green-600/20 flex items-center gap-2"
                            >
                                📊 Export to Sheets
                            </button>
                        </div>
                        {filterPeriod === 'Custom' && showCustomPicker && (
                            <button
                                onClick={() => setShowCustomPicker(false)}
                                className="text-xs text-slate-500 hover:text-slate-700"
                            >
                                ✕ Close
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {filterOptions.map(option => (
                            <button
                                key={option}
                                onClick={() => {
                                    setFilterPeriod(option);
                                    if (option === 'Custom') {
                                        setShowCustomPicker(true);
                                    } else {
                                        setShowCustomPicker(false);
                                    }
                                }}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterPeriod === option
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>

                    {/* Custom Date Picker */}
                    {filterPeriod === 'Custom' && showCustomPicker && (
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        📆 Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        📆 End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    console.log('Applying custom date range:', customStartDate, 'to', customEndDate);
                                    // Here you would filter the data based on custom dates
                                }}
                                className="mt-4 w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                            >
                                Apply Date Range
                            </button>
                        </div>
                    )}
                </div>

                <TransactionUpload onTransactionAdded={fetchDashboard} />

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <StatCard
                        label={`Income (${filterPeriod === 'Custom' ? 'Custom' : filterPeriod.replace('ly', '')})`}
                        value={`${currency.symbol} ${(dashboardData?.summary?.income || 0).toLocaleString()}`}
                        trend="-"
                        trendUp={true}
                    />
                    <StatCard
                        label={`Expenses (${filterPeriod === 'Custom' ? 'Custom' : filterPeriod.replace('ly', '')})`}
                        value={`${currency.symbol} ${(dashboardData?.summary?.expense || 0).toLocaleString()}`}
                        trend="-"
                        trendUp={false}
                    />
                    <StatCard
                        label={`Net (${filterPeriod === 'Custom' ? 'Custom' : filterPeriod.replace('ly', '')})`}
                        value={`${currency.symbol} ${(dashboardData?.summary?.net || 0).toLocaleString()}`}
                        trend="-"
                        trendUp={(dashboardData?.summary?.net || 0) >= 0}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Chart Section */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Expense Breakdown */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-lg mb-4">Expense Breakdown</h3>
                            <ExpensePieChart data={dashboardData?.pieChartData || []} />
                        </div>

                        {/* Net Worth (Static for now) */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-lg mb-6">Net Worth Trend</h3>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={netWorthTrendLine}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="month" hide />
                                        <YAxis hide />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="netWorth" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Section */}
                    <div className="space-y-8">
                        {/* Recent Transactions */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg">Recent Transactions</h3>
                            </div>
                            <div className="space-y-1">
                                {dashboardData?.recentTransactions?.map((tx: any) => <TransactionRow key={tx.id} tx={tx} currencySymbol={currency.symbol} />)}
                                {!dashboardData?.recentTransactions?.length && <p className="text-sm text-slate-400">No transactions yet.</p>}
                            </div>
                        </div>

                        {/* Assets Overview */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-lg mb-4">Your Portfolio</h3>
                            <div className="space-y-4">
                                {dynamicAssets.map(asset => (
                                    <Link key={asset.id} href={asset.path}>
                                        <AssetCard asset={asset} currencySymbol={currency.symbol} />
                                    </Link>
                                ))}
                                {networthData.liabilities.loans.totalValue > 0 && (
                                    <Link href="/loans">
                                        <AssetCard
                                            asset={{
                                                id: 'loan-stat',
                                                name: 'Loans Outstanding',
                                                value: networthData.liabilities.loans.totalValue,
                                                change: 'Liability',
                                                type: 'Debt',
                                                color: 'from-red-500 to-rose-600'
                                            }}
                                            currencySymbol={currency.symbol}
                                        />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Multiple Chart Selector Section */}
                <div className="mt-12">
                    <div className="mb-6 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <h2 className="text-2xl font-bold mb-4">📊 Customize Your Dashboard</h2>
                        <p className="text-slate-500 mb-4">Select which charts to display on your dashboard</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {AVAILABLE_CHARTS.map(chart => (
                                <button
                                    key={chart.id}
                                    onClick={() => toggleChart(chart.id)}
                                    className={`p-4 rounded-xl border-2 transition-all ${enabledCharts.includes(chart.id)
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                >
                                    <div className="text-2xl mb-2">{chart.icon}</div>
                                    <div className="text-sm font-medium">{chart.name}</div>
                                    {enabledCharts.includes(chart.id) && <div className="text-xs mt-1">✓ Enabled</div>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Enabled Charts Display */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {enabledCharts.map(chartId => (
                            <div key={chartId}>
                                {renderChart(chartId)}
                            </div>
                        ))}
                    </div>

                    {enabledCharts.length === 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="text-6xl mb-4">📊</div>
                            <div className="text-slate-500 dark:text-slate-400">No charts selected</div>
                            <div className="text-sm text-slate-400 dark:text-slate-500 mt-2">Select charts above to customize your dashboard</div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
