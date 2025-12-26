"use client";

import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../lib/currency-context';
import { useNetWorth } from '../../lib/networth-context';
import { financialDataApi } from '../../lib/api/financial-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface Stock {
    id: string;
    exchange: string;
    stockName: string;
    units: number;
    unitPrice: number;
    currentValue: number;
    totalValue: number;
    purchaseDate: string;
}

export default function StocksPage() {
    const { currency } = useCurrency();
    const { data, refreshNetWorth } = useNetWorth();
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('Holdings');
    const [formData, setFormData] = useState({
        market: 'NASDAQ',
        stockName: '',
        units: '',
        unitPrice: '',
        currentPrice: '',
        purchaseDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (data.assets.stocks.items) {
            setStocks(data.assets.stocks.items.map((s: any) => ({
                id: s.id,
                exchange: s.market || s.exchange || '',
                stockName: s.stockName || s.name || '',
                units: parseFloat(s.units) || 0,
                unitPrice: parseFloat(s.unitPrice) || 0,
                currentValue: parseFloat(s.unitPrice) || 0,
                totalValue: s.totalValue || ((parseFloat(s.units) || 0) * (parseFloat(s.unitPrice) || 0)),
                purchaseDate: (s.purchaseDate || new Date().toISOString()).split('T')[0]
            })));
        }
    }, [data.assets.stocks.items]);

    const markets = [
        'NASDAQ', 'NYSE', 'DFM (Dubai)', 'ADX (Abu Dhabi)', 'TADAWUL (Saudi)', 'LSE (London)', 'BSE (Bombay)', 'NSE (India)', 'Other'
    ];

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleEdit = (stock: Stock) => {
        setEditingId(stock.id);
        setFormData({
            market: stock.exchange,
            stockName: stock.stockName,
            units: stock.units.toString(),
            unitPrice: stock.unitPrice.toString(),
            currentPrice: stock.currentValue.toString(),
            purchaseDate: stock.purchaseDate
        });
        setActiveTab('Manage Stock');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddStock = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.stockName || !formData.units || !formData.unitPrice) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const stockData = {
                symbol: formData.stockName.split(' ')[0].toUpperCase(),
                name: formData.stockName,
                exchange: formData.market,
                quantity: parseFloat(formData.units),
                avgPrice: parseFloat(formData.unitPrice),
                currentPrice: parseFloat(formData.currentPrice || formData.unitPrice),
                notes: `Market: ${formData.market}`
            };

            if (editingId) {
                await financialDataApi.stockAssets.update(editingId, stockData);
                setEditingId(null);
                alert('✅ Stock updated successfully!');
            } else {
                await financialDataApi.stockAssets.create(stockData);
                alert('🚀 Stock added to portfolio!');
            }

            await refreshNetWorth();
            setFormData({
                market: 'NASDAQ',
                stockName: '',
                units: '',
                unitPrice: '',
                currentPrice: '',
                purchaseDate: new Date().toISOString().split('T')[0]
            });
            setActiveTab('Holdings');
        } catch (error) {
            alert('Failed to save. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({
            market: 'NASDAQ',
            stockName: '',
            units: '',
            unitPrice: '',
            currentPrice: '',
            purchaseDate: new Date().toISOString().split('T')[0]
        });
        setActiveTab('Holdings');
    };

    const handleDeleteStock = async (id: string) => {
        if (confirm('Are you sure you want to delete this stock?')) {
            try {
                await financialDataApi.stockAssets.delete(id);
                await refreshNetWorth();
            } catch (error) {
                alert('Failed to delete. Please try again.');
            }
        }
    };

    const getTotalPortfolioValue = () => stocks.reduce((sum, stock) => sum + stock.totalValue, 0);
    const getTotalInvested = () => stocks.reduce((sum, stock) => sum + (stock.units * stock.unitPrice), 0);
    const getTotalGainLoss = () => getTotalPortfolioValue() - getTotalInvested();
    const getOverallReturn = () => {
        const invested = getTotalInvested();
        return invested === 0 ? 0 : (getTotalGainLoss() / invested) * 100;
    };

    const marketDistribution = stocks.reduce((acc: any, s) => {
        const existing = acc.find((item: any) => item.name === s.exchange);
        if (existing) existing.value += s.totalValue;
        else acc.push({ name: s.exchange, value: s.totalValue });
        return acc;
    }, []);

    const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-10 flex flex-wrap justify-between items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">📈</span>
                            Stock Portfolio
                        </h1>
                        <p className="text-slate-500 mt-2">Track real-time market value and monitor your equity growth</p>
                    </div>

                    <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        {['Holdings', 'Manage Stock', 'Analytics'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-200 dark:shadow-none">
                        <div className="text-sm opacity-90 font-medium tracking-wide uppercase">Market Value</div>
                        <div className="text-4xl font-bold mt-3 font-mono">{currency.symbol} {getTotalPortfolioValue().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="mt-4 flex items-center gap-2 text-xs bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                            Real-time tracking enabled
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500 font-medium tracking-wide uppercase">Investment</div>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white mt-3 font-mono">{currency.symbol} {getTotalInvested().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="mt-2 text-xs text-slate-400">Total Capital Deployed</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500 font-medium tracking-wide uppercase">Total P&L</div>
                        <div className={`text-3xl font-bold mt-3 font-mono ${getTotalGainLoss() >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {getTotalGainLoss() >= 0 ? '+' : ''}{currency.symbol} {getTotalGainLoss().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className={`mt-2 text-xs font-bold ${getTotalGainLoss() >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {getOverallReturn().toFixed(2)}% Lifetime Yield
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500 font-medium tracking-wide uppercase">Holdings</div>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white mt-3 font-mono">{stocks.length}</div>
                        <div className="mt-2 text-xs text-slate-400">Across {new Set(stocks.map(s => s.exchange)).size} Markets</div>
                    </div>
                </div>

                {activeTab === 'Holdings' && (
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Equity Distribution</h2>
                            <button
                                onClick={() => setActiveTab('Manage Stock')}
                                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-bold rounded-xl transition-all"
                            >
                                + Buy More
                            </button>
                        </div>

                        {stocks.length === 0 ? (
                            <div className="p-20 text-center">
                                <div className="text-7xl mb-6">📉</div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No stocks found</h3>
                                <p className="text-slate-500 mb-8 max-w-sm mx-auto">Your portfolio is currently empty. Start by adding your first stock holding.</p>
                                <button
                                    onClick={() => setActiveTab('Manage Stock')}
                                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-600/20"
                                >
                                    Add Your First Stock
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                                            <th className="px-8 py-5">Share Name</th>
                                            <th className="px-8 py-5">Market Name</th>
                                            <th className="px-8 py-5 text-right">Position</th>
                                            <th className="px-8 py-5 text-right">Avg Price</th>
                                            <th className="px-8 py-5 text-right">Current Price</th>
                                            <th className="px-8 py-5 text-right">Market Value</th>
                                            <th className="px-8 py-5 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {stocks.map((stock) => {
                                            const gain = stock.totalValue - (stock.units * stock.unitPrice);
                                            const gainPercent = (gain / (stock.units * stock.unitPrice)) * 100;

                                            return (
                                                <tr key={stock.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all group">
                                                    <td className="px-8 py-6">
                                                        <div className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                                                            {stock.stockName || 'N/A'}
                                                        </div>
                                                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Common Stock</div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-bold uppercase">
                                                            {stock.exchange}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                                        {stock.units} <span className="text-[10px] text-slate-400">shares</span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right font-mono text-slate-500 dark:text-slate-400 italic">
                                                        {currency.symbol}{stock.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-8 py-6 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                        {currency.symbol}{stock.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="font-mono font-bold text-slate-900 dark:text-white text-lg">{currency.symbol}{stock.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                        <div className={`text-[10px] font-bold mt-1 uppercase ${gain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            {gain >= 0 ? '▲' : '▼'} {Math.abs(gainPercent).toFixed(2)}%
                                                            ({gain >= 0 ? '+' : ''}{currency.symbol}{Math.abs(gain).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleEdit(stock)}
                                                                className="p-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg transition-all"
                                                                title="Edit Entry"
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteStock(stock.id)}
                                                                className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 text-rose-500 rounded-lg transition-all"
                                                                title="Delete Asset"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'Manage Stock' && (
                    <div className="max-w-3xl mx-auto animate-in fade-in zoom-in duration-300">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
                            <h2 className="text-2xl font-bold mb-8 text-slate-900 dark:text-white flex items-center gap-3">
                                <span className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-xl">
                                    {editingId ? '✏️' : '➕'}
                                </span>
                                {editingId ? 'Modify Holdings' : 'Add Stock Asset'}
                            </h2>
                            <form onSubmit={handleAddStock} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Market Name</label>
                                        <select
                                            value={formData.market}
                                            onChange={(e) => handleInputChange('market', e.target.value)}
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                                        >
                                            {markets.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Share Name *</label>
                                        <input
                                            type="text"
                                            value={formData.stockName}
                                            onChange={(e) => handleInputChange('stockName', e.target.value)}
                                            placeholder="e.g., AAPL or Apple Inc."
                                            required
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Quantity held *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.units}
                                            onChange={(e) => handleInputChange('units', e.target.value)}
                                            placeholder="e.g., 50.5"
                                            required
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Avg Purchase Price ({currency.code}) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.unitPrice}
                                            onChange={(e) => handleInputChange('unitPrice', e.target.value)}
                                            placeholder="e.g., 145.20"
                                            required
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Current Price ({currency.code})</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.currentPrice}
                                            onChange={(e) => handleInputChange('currentPrice', e.target.value)}
                                            placeholder="Leave empty for auto-fetch (or enter manually)"
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Transaction Date</label>
                                        <input
                                            type="date"
                                            value={formData.purchaseDate}
                                            onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6 border-t border-slate-100 dark:border-slate-700">
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="flex-1 px-8 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all"
                                    >
                                        Discard Changes
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-[2] px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Processing...' : (editingId ? '💾 Update Portfolio' : '➕ Confirm Buy Order')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'Analytics' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                                <h3 className="text-xl font-bold mb-8 text-slate-900 dark:text-white flex items-center gap-3">
                                    <span className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">🥧</span>
                                    Market Allocation
                                </h3>
                                <div className="h-[350px]">
                                    {marketDistribution.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={marketDistribution}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={80}
                                                    outerRadius={120}
                                                    paddingAngle={5}
                                                >
                                                    {marketDistribution.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value: number) => [`${currency.symbol} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Value']}
                                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                                />
                                                <Legend iconType="circle" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-400 font-medium">No holdings yet to analyze</div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                                <h3 className="text-xl font-bold mb-8 text-slate-900 dark:text-white flex items-center gap-3">
                                    <span className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">📊</span>
                                    Position Sizing
                                </h3>
                                <div className="h-[350px]">
                                    {stocks.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stocks.sort((a, b) => b.totalValue - a.totalValue)}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="stockName" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                                <Tooltip
                                                    cursor={{ fill: '#f1f5f9' }}
                                                    formatter={(value: number) => [`${currency.symbol} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Value']}
                                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                                />
                                                <Bar dataKey="totalValue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-400 font-medium">Add stocks to see visualization</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes slideIn {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-in {
                    animation: slideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
}
