"use client";

import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../lib/currency-context';
import { useNetWorth } from '../../lib/networth-context';
import { financialDataApi } from '../../lib/api/financial-data';

export default function GoalsPage() {
    const { currency } = useCurrency();
    const { data: networthData } = useNetWorth();
    const [isLoading, setIsLoading] = useState(false);

    const [goals, setGoals] = useState({
        commodityType: 'Gold',
        commodityGrams: '',
        propertyType: 'Apartment',
        propertyValue: '',
        monthlyIncome: '',
        cashAndBank: '',
        stocks: '',
        bonds: '',
    });

    const [activeGoal, setActiveGoal] = useState({
        id: '',
        goalNetWorth: '',
        targetDate: '',
        notes: ''
    });

    // Use calculated net worth from NetWorthContext
    const currentNetWorth = networthData.netWorth;

    // Load goals from API
    const fetchGoals = async () => {
        try {
            setIsLoading(true);
            const res = await financialDataApi.goals.getAll();
            const fetchedGoals = res.data;

            if (fetchedGoals && fetchedGoals.length > 0) {
                // Map data from database to state
                const primaryGoal = fetchedGoals.find((g: any) => g.type === 'NETWORTH');
                if (primaryGoal) {
                    setActiveGoal({
                        id: primaryGoal.id,
                        goalNetWorth: primaryGoal.targetAmount.toString(),
                        targetDate: primaryGoal.targetDate.split('T')[0],
                        notes: primaryGoal.notes || ''
                    });
                }

                // Map secondary goals
                const goldGoal = fetchedGoals.find((g: any) => g.type === 'GOLD');
                const propertyGoal = fetchedGoals.find((g: any) => g.type === 'PROPERTY');
                const stocksGoal = fetchedGoals.find((g: any) => g.type === 'STOCKS');
                const cashGoal = fetchedGoals.find((g: any) => g.type === 'CASH');
                const bondsGoal = fetchedGoals.find((g: any) => g.type === 'BONDS');
                const incomeGoal = fetchedGoals.find((g: any) => g.type === 'INCOME');

                setGoals(prev => ({
                    ...prev,
                    commodityGrams: goldGoal?.targetAmount.toString() || '',
                    propertyValue: propertyGoal?.targetAmount.toString() || '',
                    stocks: stocksGoal?.targetAmount.toString() || '',
                    cashAndBank: cashGoal?.targetAmount.toString() || '',
                    bonds: bondsGoal?.targetAmount.toString() || '',
                    monthlyIncome: incomeGoal?.targetAmount.toString() || '',
                }));
            }
        } catch (e) {
            console.error('Failed to load goals', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGoals();
    }, []);

    const calculateProgress = () => {
        const goal = parseFloat(activeGoal.goalNetWorth) || 0;
        if (goal === 0) return { percentage: 0, remaining: 0, monthsLeft: 0, monthlyRequired: 0, status: 'ontrack' };

        const progressPercentage = (currentNetWorth / goal) * 100;
        const remaining = goal - currentNetWorth;

        if (!activeGoal.targetDate) return { percentage: progressPercentage, remaining, monthsLeft: 0, monthlyRequired: 0, status: 'ontrack' };

        const targetDate = new Date(activeGoal.targetDate);
        const today = new Date();
        const monthsLeft = Math.max(0, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)));
        const monthlyRequired = monthsLeft > 0 ? remaining / monthsLeft : 0;

        return { percentage: progressPercentage, remaining, monthsLeft, monthlyRequired, status: 'ontrack' };
    };

    const progress = calculateProgress();

    const handleChange = (field: string, value: string) => {
        setGoals(prev => ({ ...prev, [field]: value }));
    };

    const handleActiveGoalChange = (field: string, value: string) => {
        setActiveGoal(prev => ({ ...prev, [field]: value }));
    };

    const saveActiveGoal = async () => {
        if (activeGoal.goalNetWorth && activeGoal.targetDate) {
            const payload = {
                name: 'Primary Net Worth Goal',
                type: 'NETWORTH',
                targetAmount: parseFloat(activeGoal.goalNetWorth),
                targetDate: new Date(activeGoal.targetDate).toISOString(),
                notes: activeGoal.notes,
                currentAmount: currentNetWorth
            };

            try {
                if (activeGoal.id) {
                    await financialDataApi.goals.update(activeGoal.id, payload);
                } else {
                    await financialDataApi.goals.create(payload);
                }
                alert('✅ Active goal saved to database!');
                fetchGoals();
            } catch (err) {
                alert('Failed to save goal');
            }
        } else {
            alert('⚠️ Please enter both Goal Net Worth and Target Date');
        }
    };

    const handleSave = async () => {
        try {
            setIsLoading(true);
            const secondaryMappings = [
                { type: 'GOLD', value: goals.commodityGrams, name: 'Gold Target' },
                { type: 'PROPERTY', value: goals.propertyValue, name: 'Property Target' },
                { type: 'STOCKS', value: goals.stocks, name: 'Stocks Target' },
                { type: 'CASH', value: goals.cashAndBank, name: 'Cash Target' },
                { type: 'BONDS', value: goals.bonds, name: 'Bonds Target' },
                { type: 'INCOME', value: goals.monthlyIncome, name: 'Income Target' },
            ];

            const existingGoalsRes = await financialDataApi.goals.getAll();
            const existingGoals = existingGoalsRes.data;

            for (const map of secondaryMappings) {
                if (map.value) {
                    const existing = existingGoals.find((g: any) => g.type === map.type);
                    const payload = {
                        name: map.name,
                        type: map.type,
                        targetAmount: parseFloat(map.value),
                        targetDate: activeGoal.targetDate ? new Date(activeGoal.targetDate).toISOString() : new Date().toISOString(),
                    };

                    if (existing) {
                        await financialDataApi.goals.update(existing.id, payload);
                    } else {
                        await financialDataApi.goals.create(payload);
                    }
                }
            }
            alert('Goals saved successfully! 🎯');
            fetchGoals();
        } catch (err) {
            alert('Failed to save secondary goals');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-5xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">🎯 Financial Goals</h1>
                    <p className="text-slate-500 mt-2">Set and track your investment and wealth targets</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Commodity Investment Goal */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-2xl">
                                🥇
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Commodity Investment</h3>
                                <p className="text-sm text-slate-500">Target in grams</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Commodity Type
                                </label>
                                <select
                                    value={goals.commodityType}
                                    onChange={(e) => handleChange('commodityType', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                >
                                    <option value="Gold">Gold</option>
                                    <option value="Silver">Silver</option>
                                    <option value="Others">Others</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Target Grams
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={goals.commodityGrams}
                                        onChange={(e) => handleChange('commodityGrams', e.target.value)}
                                        placeholder="e.g., 500"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                    />
                                    <span className="absolute right-4 top-3.5 text-slate-400 text-sm">grams</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Property Goal */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-2xl">
                                🏠
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Property</h3>
                                <p className="text-sm text-slate-500">Real estate target</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Property Type
                                </label>
                                <select
                                    value={goals.propertyType}
                                    onChange={(e) => handleChange('propertyType', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="Apartment">Apartment</option>
                                    <option value="Villa">Villa</option>
                                    <option value="Land">Land</option>
                                    <option value="Commercial">Commercial</option>
                                    <option value="Townhouse">Townhouse</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Target Value
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={goals.propertyValue}
                                        onChange={(e) => handleChange('propertyValue', e.target.value)}
                                        placeholder="e.g., 1000000"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <span className="absolute right-4 top-3.5 text-slate-400 text-sm">{currency.code}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Income Goal */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-2xl">
                                💰
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Monthly Income</h3>
                                <p className="text-sm text-slate-500">Passive income target</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Target Amount
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={goals.monthlyIncome}
                                    onChange={(e) => handleChange('monthlyIncome', e.target.value)}
                                    placeholder="e.g., 25000"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                                />
                                <span className="absolute right-4 top-3.5 text-slate-400 text-sm">{currency.code}/month</span>
                            </div>
                        </div>
                    </div>

                    {/* Stocks Goal */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-2xl">
                                📈
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Stocks</h3>
                                <p className="text-sm text-slate-500">Portfolio target value</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Target Value
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={goals.stocks}
                                    onChange={(e) => handleChange('stocks', e.target.value)}
                                    placeholder="e.g., 500000"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                                <span className="absolute right-4 top-3.5 text-slate-400 text-sm">{currency.code}</span>
                            </div>
                        </div>
                    </div>

                    {/* Cash and Bank Goal */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-2xl">
                                🏦
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Cash & Bank Balance</h3>
                                <p className="text-sm text-slate-500">Liquid savings target</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Target Balance
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={goals.cashAndBank}
                                    onChange={(e) => handleChange('cashAndBank', e.target.value)}
                                    placeholder="e.g., 200000"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                                <span className="absolute right-4 top-3.5 text-slate-400 text-sm">{currency.code}</span>
                            </div>
                        </div>
                    </div>

                    {/* Bonds Goal */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-2xl">
                                📜
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Bonds</h3>
                                <p className="text-sm text-slate-500">Fixed income target</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Target Value
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={goals.bonds}
                                    onChange={(e) => handleChange('bonds', e.target.value)}
                                    placeholder="e.g., 300000"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <span className="absolute right-4 top-3.5 text-slate-400 text-sm">{currency.code}</span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex gap-4">
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex-1 lg:flex-none px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50"
                    >
                        {isLoading ? 'Saving...' : '💾 Save Goals'}
                    </button>
                    <button
                        onClick={() => setGoals({
                            commodityType: 'Gold',
                            commodityGrams: '',
                            propertyType: 'Apartment',
                            propertyValue: '',
                            monthlyIncome: '',
                            cashAndBank: '',
                            stocks: '',
                            bonds: '',
                        })}
                        className="px-8 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium rounded-xl transition-colors"
                    >
                        🔄 Reset
                    </button>
                </div>

                {/* Summary Card */}
                {Object.values(goals).some(v => v) && (
                    <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4">📊 Goals Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {goals.commodityGrams && (
                                <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl">
                                    <div className="text-2xl mb-1">🥇</div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">{goals.commodityType || 'Commodity'}</div>
                                    <div className="font-bold text-slate-900 dark:text-white">{goals.commodityGrams}g</div>
                                </div>
                            )}
                            {goals.propertyValue && (
                                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                                    <div className="text-2xl mb-1">🏠</div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">Property</div>
                                    <div className="font-bold text-slate-900 dark:text-white">{currency.symbol} {parseInt(goals.propertyValue).toLocaleString()}</div>
                                </div>
                            )}
                            {goals.monthlyIncome && (
                                <div className="text-center p-3 bg-green-50 dark:bg-green-900/10 rounded-xl">
                                    <div className="text-2xl mb-1">💰</div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">Monthly</div>
                                    <div className="font-bold text-slate-900 dark:text-white">{currency.symbol} {parseInt(goals.monthlyIncome).toLocaleString()}</div>
                                </div>
                            )}
                            {goals.cashAndBank && (
                                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl">
                                    <div className="text-2xl mb-1">🏦</div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">Cash & Bank</div>
                                    <div className="font-bold text-slate-900 dark:text-white">{currency.symbol} {parseInt(goals.cashAndBank).toLocaleString()}</div>
                                </div>
                            )}
                            {goals.stocks && (
                                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl">
                                    <div className="text-2xl mb-1">📈</div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">Stocks</div>
                                    <div className="font-bold text-slate-900 dark:text-white">{currency.symbol} {parseInt(goals.stocks).toLocaleString()}</div>
                                </div>
                            )}
                            {goals.bonds && (
                                <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl">
                                    <div className="text-2xl mb-1">📜</div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">Bonds</div>
                                    <div className="font-bold text-slate-900 dark:text-white">{currency.symbol} {parseInt(goals.bonds).toLocaleString()}</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Active Net Worth Goal Section */}
                <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 shadow-lg text-white mt-8 mb-32">
                    <h2 className="text-2xl font-bold mb-6">🎯 Set Your Net Worth Goal</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-purple-100 mb-2">
                                Goal Net Worth ({currency.code})
                            </label>
                            <input
                                type="number"
                                value={activeGoal.goalNetWorth}
                                onChange={(e) => handleActiveGoalChange('goalNetWorth', e.target.value)}
                                placeholder="e.g., 5000000"
                                className="w-full px-4 py-3 rounded-xl border-2 border-purple-400 bg-white text-slate-900 focus:ring-2 focus:ring-white outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-purple-100 mb-2">
                                Target Date
                            </label>
                            <input
                                type="date"
                                value={activeGoal.targetDate}
                                onChange={(e) => handleActiveGoalChange('targetDate', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-purple-400 bg-white text-slate-900 focus:ring-2 focus:ring-white outline-none"
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-purple-100 mb-2">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={activeGoal.notes}
                            onChange={(e) => handleActiveGoalChange('notes', e.target.value)}
                            placeholder="Add any notes about your goal..."
                            rows={2}
                            className="w-full px-4 py-3 rounded-xl border-2 border-purple-400 bg-white text-slate-900 focus:ring-2 focus:ring-white outline-none"
                        />
                    </div>

                    <button
                        onClick={saveActiveGoal}
                        disabled={isLoading}
                        className="mt-6 w-full px-6 py-3 bg-white text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-colors shadow-lg disabled:opacity-50"
                    >
                        {isLoading ? 'Saving...' : '💾 Save Active Goal & Sync to Database'}
                    </button>
                </div>
            </div>

            {/* Sticky Bottom Progress Card */}
            {
                activeGoal.goalNetWorth && (
                    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-emerald-600 to-green-600 shadow-2xl border-t-4 border-emerald-400 z-50">
                        <div className="max-w-7xl mx-auto px-6 py-4">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white/20 p-3 rounded-xl">
                                        <div className="text-2xl">🎯</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-emerald-100 uppercase tracking-wide">Active Goal</div>
                                        <div className="text-xl font-bold text-white">Net Worth: {currency.symbol} {parseFloat(activeGoal.goalNetWorth || '0').toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="text-center">
                                        <div className="text-xs text-emerald-100">Current</div>
                                        <div className="text-lg font-bold text-white">{currency.symbol} {currentNetWorth.toLocaleString()}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-emerald-100">Progress</div>
                                        <div className="text-lg font-bold text-white">{progress.percentage.toFixed(1)}%</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-emerald-100">Remaining</div>
                                        <div className="text-lg font-bold text-white">{currency.symbol} {Math.max(0, progress.remaining).toLocaleString()}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-emerald-100">Months Left</div>
                                        <div className="text-lg font-bold text-white">{progress.monthsLeft}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-emerald-100">Monthly Required</div>
                                        <div className="text-lg font-bold text-white">{currency.symbol} {Math.max(0, progress.monthlyRequired).toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className="w-full md:w-64">
                                    <div className="bg-emerald-800/50 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-white h-3 rounded-full transition-all"
                                            style={{ width: `${Math.min(progress.percentage, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs text-emerald-100 mt-1 text-center">
                                        Target: {activeGoal.targetDate && new Date(activeGoal.targetDate).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
