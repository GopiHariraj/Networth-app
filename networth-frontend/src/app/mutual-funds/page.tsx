"use client";

import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../lib/currency-context';
import { useNetWorth } from '../../lib/networth-context';
import { financialDataApi } from '../../lib/api/financial-data';
import { PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MutualFund {
    id: string;
    fundName: string;
    provider: string;
    folioNumber?: string;
    fundType: string;
    units?: number;
    currentNav?: number;
    currentValue: number;
    investedAmount: number;
    currency: string;
    lastUpdated: string;
    notes?: string;
}

const FUND_TYPES = ['Equity', 'Debt', 'Hybrid', 'Index', 'Other'];
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function MutualFundsPage() {
    const { currency } = useCurrency();
    const { refreshNetWorth } = useNetWorth();
    const [funds, setFunds] = useState<MutualFund[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('Current Value');
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        fundName: '',
        provider: '',
        folioNumber: '',
        fundType: 'Equity',
        units: '',
        currentNav: '',
        currentValue: '',
        investedAmount: '',
        currency: 'AED',
        lastUpdated: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const fetchFunds = async () => {
        try {
            setIsLoading(true);
            const res = await financialDataApi.mutualFunds.getAll();
            setFunds(res.data.map((f: any) => ({
                id: f.id,
                fundName: f.name,
                provider: f.provider,
                folioNumber: f.folioNumber,
                fundType: f.type,
                units: f.units ? parseFloat(f.units) : undefined,
                currentNav: f.nav ? parseFloat(f.nav) : undefined,
                currentValue: parseFloat(f.currentValue),
                investedAmount: parseFloat(f.investedAmount),
                currency: 'AED',
                lastUpdated: f.updatedAt,
                notes: f.notes
            })));
        } catch (e) {
            console.error('Failed to load mutual funds', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFunds();
    }, []);

    const getGainLoss = (currentValue: number, invested: number) => currentValue - invested;
    const getPercentReturn = (gainLoss: number, invested: number) => invested > 0 ? (gainLoss / invested) * 100 : 0;

    const totalValue = funds.reduce((sum, f) => sum + f.currentValue, 0);
    const totalInvested = funds.reduce((sum, f) => sum + f.investedAmount, 0);
    const totalGainLoss = totalValue - totalInvested;
    const totalPercentReturn = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.fundName || !formData.provider || !formData.investedAmount) {
            alert('Please fill in Fund Name, Provider, and Invested Amount');
            return;
        }

        const hasUnitsAndNav = formData.units && formData.currentNav;
        const hasCurrentValue = formData.currentValue;

        if (!hasUnitsAndNav && !hasCurrentValue) {
            alert('Please provide either (Units + Current NAV) OR Current Value');
            return;
        }

        let calculatedValue = 0;
        if (hasUnitsAndNav) {
            calculatedValue = parseFloat(formData.units) * parseFloat(formData.currentNav);
        } else {
            calculatedValue = parseFloat(formData.currentValue);
        }

        const payload = {
            name: formData.fundName,
            provider: formData.provider,
            folioNumber: formData.folioNumber,
            type: formData.fundType,
            units: formData.units ? parseFloat(formData.units) : undefined,
            nav: formData.currentNav ? parseFloat(formData.currentNav) : undefined,
            currentValue: calculatedValue,
            investedAmount: parseFloat(formData.investedAmount),
            notes: formData.notes
        };

        try {
            if (editingId) {
                await financialDataApi.mutualFunds.update(editingId, payload);
                alert('✅ Mutual fund updated successfully!');
            } else {
                await financialDataApi.mutualFunds.create(payload);
                alert('✅ Mutual fund added successfully!');
            }

            await fetchFunds();
            await refreshNetWorth();
            setEditingId(null);
            handleCancel();
        } catch (err) {
            alert('Failed to save mutual fund');
        }
    };

    const handleEdit = (fund: MutualFund) => {
        setEditingId(fund.id);
        setFormData({
            fundName: fund.fundName,
            provider: fund.provider,
            folioNumber: fund.folioNumber || '',
            fundType: fund.fundType,
            units: fund.units ? fund.units.toString() : '',
            currentNav: fund.currentNav ? fund.currentNav.toString() : '',
            currentValue: (!fund.units || !fund.currentNav) ? fund.currentValue.toString() : '',
            investedAmount: fund.investedAmount.toString(),
            currency: fund.currency,
            lastUpdated: fund.lastUpdated.split('T')[0],
            notes: fund.notes || ''
        });
        setActiveTab('Add/Edit Fund');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this mutual fund?')) {
            try {
                await financialDataApi.mutualFunds.delete(id);
                await fetchFunds();
                await refreshNetWorth();
            } catch (err) {
                alert('Failed to delete mutual fund');
            }
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({
            fundName: '',
            provider: '',
            folioNumber: '',
            fundType: 'Equity',
            units: '',
            currentNav: '',
            currentValue: '',
            investedAmount: '',
            currency: 'AED',
            lastUpdated: new Date().toISOString().split('T')[0],
            notes: ''
        });
    };

    const allocationData = FUND_TYPES.map(type => ({
        name: type,
        value: funds.filter(f => f.fundType === type)
            .reduce((sum, f) => sum + f.currentValue, 0)
    })).filter(d => d.value > 0);

    const topFundsData = [...funds]
        .sort((a, b) => b.currentValue - a.currentValue)
        .slice(0, 5)
        .map(f => ({
            name: f.fundName.length > 20 ? f.fundName.substring(0, 20) + '...' : f.fundName,
            value: f.currentValue
        }));

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">📊 Mutual Funds</h1>
                    <p className="text-slate-500 mt-2">Track your mutual fund investments and monitor returns</p>
                </header>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto">
                    {['Current Value', 'Profit & Loss', 'Add/Edit Fund'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === tab
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="text-sm opacity-90">Total Value</div>
                        <div className="text-3xl font-bold mt-2">{currency.symbol} {totalValue.toLocaleString()}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500">Total Invested</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{currency.symbol} {totalInvested.toLocaleString()}</div>
                    </div>
                    <div className={`rounded-2xl p-6 shadow-sm border ${totalGainLoss >= 0 ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800'}`}>
                        <div className="text-sm text-slate-500">Gain/Loss</div>
                        <div className={`text-2xl font-bold mt-2 ${totalGainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {totalGainLoss >= 0 ? '+' : ''}{currency.symbol} {totalGainLoss.toLocaleString()}
                        </div>
                    </div>
                    <div className={`rounded-2xl p-6 shadow-sm border ${totalPercentReturn >= 0 ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800'}`}>
                        <div className="text-sm text-slate-500">% Return</div>
                        <div className={`text-2xl font-bold mt-2 ${totalPercentReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {totalPercentReturn >= 0 ? '+' : ''}{totalPercentReturn.toFixed(2)}%
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'Current Value' && (
                    <CurrentValueTab
                        funds={funds}
                        getGainLoss={getGainLoss}
                        getPercentReturn={getPercentReturn}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                        allocationData={allocationData}
                        topFundsData={topFundsData}
                        totalValue={totalValue}
                        COLORS={COLORS}
                        currency={currency}
                    />
                )}

                {activeTab === 'Profit & Loss' && (
                    <ProfitLossTab
                        funds={funds}
                        getGainLoss={getGainLoss}
                        getPercentReturn={getPercentReturn}
                        totalInvested={totalInvested}
                        totalValue={totalValue}
                        totalGainLoss={totalGainLoss}
                        totalPercentReturn={totalPercentReturn}
                        currency={currency}
                    />
                )}

                {activeTab === 'Add/Edit Fund' && (
                    <AddEditFundTab
                        formData={formData}
                        setFormData={setFormData}
                        editingId={editingId}
                        handleSubmit={handleSubmit}
                        handleCancel={handleCancel}
                        getGainLoss={getGainLoss}
                        getPercentReturn={getPercentReturn}
                        FUND_TYPES={FUND_TYPES}
                        currency={currency}
                        isLoading={isLoading}
                    />
                )}
            </div>
        </div>
    );
}

// Current Value Tab Component
function CurrentValueTab({ funds, getGainLoss, getPercentReturn, handleEdit, handleDelete, allocationData, topFundsData, totalValue, COLORS, currency }: any) {
    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Mutual Funds ({funds.length})</h2>
                </div>
                {funds.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-6xl mb-4">📊</div>
                        <div className="text-slate-500">No mutual funds yet</div>
                        <div className="text-sm text-slate-400 mt-2">Add your first fund to get started</div>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {funds.map((fund: any) => {
                            const gainLoss = getGainLoss(fund.currentValue, fund.investedAmount);
                            const percentReturn = getPercentReturn(gainLoss, fund.investedAmount);

                            return (
                                <div key={fund.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="font-bold text-lg text-slate-900 dark:text-white">{fund.fundName}</div>
                                                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                                    {fund.fundType}
                                                </span>
                                            </div>
                                            <div className="text-sm text-slate-500 mb-3">
                                                {fund.provider} {fund.folioNumber && `• ${fund.folioNumber}`}
                                            </div>
                                            {fund.units && fund.currentNav ? (
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <div className="text-slate-400">Units</div>
                                                        <div className="font-semibold text-slate-700 dark:text-slate-300">{fund.units}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-slate-400">Current NAV</div>
                                                        <div className="font-semibold text-slate-700 dark:text-slate-300">{currency.symbol} {fund.currentNav.toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-slate-400">Direct value entry</div>
                                            )}
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-xs text-slate-400 mb-1">Current Value</div>
                                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                        {currency.symbol} {fund.currentValue.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-400 mb-1">Invested</div>
                                                    <div className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                                                        {currency.symbol} {fund.investedAmount.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-400 mb-1">Gain/Loss</div>
                                                    <div className={`text-lg font-bold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {gainLoss >= 0 ? '+' : ''}{currency.symbol} {gainLoss.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-400 mb-1">% Return</div>
                                                    <div className={`text-lg font-bold ${percentReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {percentReturn >= 0 ? '+' : ''}{percentReturn.toFixed(2)}%
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 justify-end mt-4">
                                        <button
                                            onClick={() => handleEdit(fund)}
                                            className="px-4 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(fund.id)}
                                            className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Charts */}
            {funds.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Allocation by Type</h3>
                        {allocationData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={allocationData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={(entry) => `${entry.name}: ${((entry.value / totalValue) * 100).toFixed(1)}%`}
                                    >
                                        {allocationData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `${currency.symbol} ${value.toLocaleString()}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-slate-400">
                                No data to display
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Top Funds by Value</h3>
                        {topFundsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={topFundsData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={120} />
                                    <Tooltip formatter={(value: number) => `${currency.symbol} ${value.toLocaleString()}`} />
                                    <Bar dataKey="value" fill="#3b82f6" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-slate-400">
                                No data to display
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Profit & Loss Tab Component
function ProfitLossTab({ funds, getGainLoss, getPercentReturn, totalInvested, totalValue, totalGainLoss, totalPercentReturn, currency }: any) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profit & Loss Analysis</h2>
            </div>
            {funds.length === 0 ? (
                <div className="p-12 text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <div className="text-slate-500">No data available</div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fund Name</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Invested</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Current Value</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Gain/Loss</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">% Return</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {funds.map((fund: any) => {
                                const gainLoss = getGainLoss(fund.currentValue, fund.investedAmount);
                                const percentReturn = getPercentReturn(gainLoss, fund.investedAmount);

                                return (
                                    <tr key={fund.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900 dark:text-white">{fund.fundName}</div>
                                            <div className="text-xs text-slate-500">{fund.fundType}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-700 dark:text-slate-300">
                                            {currency.symbol} {fund.investedAmount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-white">
                                            {currency.symbol} {fund.currentValue.toLocaleString()}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {gainLoss >= 0 ? '+' : ''}{currency.symbol} {gainLoss.toLocaleString()}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold ${percentReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {percentReturn >= 0 ? '+' : ''}{percentReturn.toFixed(2)}%
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${gainLoss >= 0
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {gainLoss >= 0 ? '📈 Profit' : '📉 Loss'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr className="bg-slate-100 dark:bg-slate-800 font-bold">
                                <td className="px-6 py-4">TOTAL</td>
                                <td className="px-6 py-4 text-right">{currency.symbol} {totalInvested.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">{currency.symbol} {totalValue.toLocaleString()}</td>
                                <td className={`px-6 py-4 text-right ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {totalGainLoss >= 0 ? '+' : ''}{currency.symbol} {totalGainLoss.toLocaleString()}
                                </td>
                                <td className={`px-6 py-4 text-right ${totalPercentReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {totalPercentReturn >= 0 ? '+' : ''}{totalPercentReturn.toFixed(2)}%
                                </td>
                                <td className="px-6 py-4"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// Add/Edit Fund Tab Component
function AddEditFundTab({ formData, setFormData, editingId, handleSubmit, handleCancel, getGainLoss, getPercentReturn, FUND_TYPES, currency, isLoading }: any) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 max-w-3xl mx-auto">
            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">
                {editingId ? '✏️ Edit Mutual Fund' : '➕ Add Mutual Fund'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fund Name *</label>
                    <input
                        type="text"
                        value={formData.fundName}
                        onChange={(e) => setFormData({ ...formData, fundName: e.target.value })}
                        placeholder="e.g., HDFC Equity Fund"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">AMC/Provider *</label>
                        <input
                            type="text"
                            value={formData.provider}
                            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                            placeholder="e.g., HDFC AMC"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Folio Number</label>
                        <input
                            type="text"
                            value={formData.folioNumber}
                            onChange={(e) => setFormData({ ...formData, folioNumber: e.target.value })}
                            placeholder="Optional"
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fund Type *</label>
                    <select
                        value={formData.fundType}
                        onChange={(e) => setFormData({ ...formData, fundType: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        {FUND_TYPES.map((type: string) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                {/* Flexible Value Input Section */}
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">💡 Current Value - Choose Input Method:</div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Units (optional)</label>
                            <input
                                type="number"
                                step="0.0001"
                                value={formData.units}
                                onChange={(e) => setFormData({ ...formData, units: e.target.value, currentValue: '' })}
                                placeholder="100"
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current NAV (optional)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.currentNav}
                                onChange={(e) => setFormData({ ...formData, currentNav: e.target.value, currentValue: '' })}
                                placeholder="450.50"
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="text-center text-xs text-slate-500 uppercase font-semibold mb-3">OR</div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Value (optional)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.currentValue}
                            onChange={(e) => setFormData({ ...formData, currentValue: e.target.value, units: '', currentNav: '' })}
                            placeholder="45000"
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Invested Amount *</label>
                    <input
                        type="number"
                        step="0.01"
                        value={formData.investedAmount}
                        onChange={(e) => setFormData({ ...formData, investedAmount: e.target.value })}
                        placeholder="40000"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                {/* Live P&L Calculation Preview */}
                {formData.investedAmount && ((formData.units && formData.currentNav) || formData.currentValue) && (() => {
                    const currentVal = formData.units && formData.currentNav
                        ? parseFloat(formData.units) * parseFloat(formData.currentNav)
                        : parseFloat(formData.currentValue || '0');
                    const gainLoss = getGainLoss(currentVal, parseFloat(formData.investedAmount));
                    const percentReturn = getPercentReturn(gainLoss, parseFloat(formData.investedAmount));

                    return (
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
                            <div className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">📊 Live P&L Preview</div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <div className="text-slate-600 dark:text-slate-400">Current Value</div>
                                    <div className="font-bold text-slate-900 dark:text-white text-lg">
                                        {currency.symbol} {currentVal.toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-600 dark:text-slate-400">Gain/Loss</div>
                                    <div className={`font-bold text-lg ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {gainLoss >= 0 ? '+' : ''}{currency.symbol} {gainLoss.toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-600 dark:text-slate-400">% Return</div>
                                    <div className={`font-bold text-lg ${percentReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {percentReturn >= 0 ? '+' : ''}{percentReturn.toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Last Updated Date</label>
                        <input
                            type="date"
                            value={formData.lastUpdated}
                            onChange={(e) => setFormData({ ...formData, lastUpdated: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>


                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Notes</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={2}
                        placeholder="Optional notes..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div className="flex gap-2">
                    {editingId && (
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold rounded-xl transition-colors"
                        >
                            ✖️ Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                    >
                        {isLoading ? 'Processing...' : (editingId ? '💾 Update' : '➕ Add Fund')}
                    </button>
                </div>
            </form>
        </div>
    );
}
