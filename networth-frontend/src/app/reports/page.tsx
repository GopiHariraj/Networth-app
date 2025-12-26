"use client";

import React from 'react';
import { useCurrency } from '../../lib/currency-context';
import { useNetWorth } from '../../lib/networth-context';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

export default function ReportsPage() {
    const { currency } = useCurrency();
    const { data } = useNetWorth();

    const netWorth = data.netWorth;
    const totalAssets = data.totalAssets;
    const totalLiabilities = data.totalLiabilities;

    const summaryData = [
        { name: 'Assets', value: totalAssets },
        { name: 'Liabilities', value: totalLiabilities }
    ];

    const detailedBreakdown = [
        { category: 'Property', assets: data.assets.property.totalValue, liabilities: data.liabilities.loans.totalValue },
        { category: 'Stocks & MF', assets: data.assets.stocks.totalValue + data.assets.mutualFunds.totalValue, liabilities: data.liabilities.creditCards.totalValue },
        { category: 'Cash & Bonds', assets: data.assets.cash.totalCash + data.assets.bonds.totalValue, liabilities: 0 },
        { category: 'Precious Metals', assets: data.assets.gold.totalValue, liabilities: 0 }
    ];

    const assetAllocation = [
        { name: 'Real Estate', value: data.assets.property.totalValue },
        { name: 'Equities', value: data.assets.stocks.totalValue + data.assets.mutualFunds.totalValue },
        { name: 'Cash', value: data.assets.cash.totalCash },
        { name: 'Gold', value: data.assets.gold.totalValue },
        { name: 'Fixed Income', value: data.assets.bonds.totalValue }
    ].filter(a => a.value > 0);

    // Get top 5 holdings across all categories
    const allHoldings = [
        ...(data.assets.property.items || []).map((i: any) => ({ name: i.name, value: parseFloat(i.value), type: 'Property' })),
        ...(data.assets.stocks.items || []).map((i: any) => ({ name: i.name, value: parseFloat(i.currentValue), type: 'Stock' })),
        ...(data.assets.mutualFunds.items || []).map((i: any) => ({ name: i.name, value: parseFloat(i.currentValue), type: 'Mutual Fund' })),
        ...(data.assets.gold.items || []).map((i: any) => ({ name: i.name, value: parseFloat(i.currentValue), type: 'Gold' })),
        ...(data.assets.bonds.items || []).map((i: any) => ({ name: i.name, value: parseFloat(i.currentValue), type: 'Bond' }))
    ].sort((a, b) => b.value - a.value).slice(0, 8);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">📊 Consolidated Financial Report</h1>
                    <p className="text-slate-500 mt-2 text-lg">A 360-degree view of your global net worth and financial position</p>
                </header>

                {/* Main Net Worth Card */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 shadow-xl border border-slate-200 dark:border-slate-700 mb-10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div>
                            <div className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2">My Total Net Worth</div>
                            <div className="text-6xl font-black text-slate-900 dark:text-white leading-tight">
                                {currency.symbol} {netWorth.toLocaleString()}
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-emerald-500 font-bold">
                                <span className="bg-emerald-500/10 px-3 py-1 rounded-full text-xs">↑ 4.2% from last month</span>
                            </div>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <div className="flex-1 md:flex-none px-8 py-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <div className="text-xs text-slate-400 font-bold uppercase mb-1">Total Assets</div>
                                <div className="text-xl font-black text-blue-600">{currency.symbol} {totalAssets.toLocaleString()}</div>
                            </div>
                            <div className="flex-1 md:flex-none px-8 py-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <div className="text-xs text-slate-400 font-bold uppercase mb-1">Total Liabilities</div>
                                <div className="text-xl font-black text-rose-600">{currency.symbol} {totalLiabilities.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    {/* Assets vs Liabilities Breakdown */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8">Asset vs Liability by Category</h3>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={detailedBreakdown} margin={{ top: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="category" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} hide />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend iconType="circle" />
                                    <Bar dataKey="assets" name="Assets" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                                    <Bar dataKey="liabilities" name="Liabilities" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Wealth Distribution */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8">Absolute Wealth Allocation</h3>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={assetAllocation}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={90}
                                        outerRadius={130}
                                        paddingAngle={4}
                                    >
                                        {assetAllocation.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => [`${currency.symbol} ${value.toLocaleString()}`, 'Total Value']}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                    {/* Top Holdings Table */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-8 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Largest Financial Items</h3>
                            <button className="text-blue-600 text-sm font-bold uppercase tracking-wider">Export List</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                        <th className="px-8 py-5 text-left">Asset Name</th>
                                        <th className="px-8 py-5 text-left">Category</th>
                                        <th className="px-8 py-5 text-right">Value</th>
                                        <th className="px-8 py-5 text-right">Portf. Weight</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {allHoldings.map((holding, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                                            <td className="px-8 py-5 font-bold text-slate-900 dark:text-white">{holding.name}</td>
                                            <td className="px-8 py-5 text-sm">
                                                <span className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-slate-600 dark:text-slate-300">
                                                    {holding.type}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right font-mono font-bold text-slate-900 dark:text-white">{currency.symbol} {holding.value.toLocaleString()}</td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <span className="text-xs font-bold text-slate-400">{((holding.value / totalAssets) * 100).toFixed(1)}%</span>
                                                    <div className="w-16 bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                        <div className="bg-blue-500 h-full" style={{ width: `${(holding.value / totalAssets) * 100}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* AI Insights Card */}
                    <div className="lg:col-span-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 text-4xl opacity-20">✨</div>
                        <h3 className="text-xl font-bold mb-8">Smart Financial Insights</h3>
                        <div className="space-y-6 relative z-10">
                            <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                <div className="text-2xl">⚡</div>
                                <div>
                                    <div className="font-bold text-blue-400 text-sm italic">Liquidity Alert</div>
                                    <p className="text-xs text-slate-300 mt-1">Your cash reserves are {((data.assets.cash.totalCash / totalAssets) * 100).toFixed(1)}% of total assets. Consider shifting some to higher yield investments.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                <div className="text-2xl">🏠</div>
                                <div>
                                    <div className="font-bold text-amber-400 text-sm italic">Property Insight</div>
                                    <p className="text-xs text-slate-300 mt-1">Real estate accounts for {((data.assets.property.totalValue / totalAssets) * 100).toFixed(1)}% of wealth. Diversification in liquid assets is recommended.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                <div className="text-2xl">📉</div>
                                <div>
                                    <div className="font-bold text-rose-400 text-sm italic">Debt Management</div>
                                    <p className="text-xs text-slate-300 mt-1">Liabilities are concentrated in {totalLiabilities > 0 ? 'Home Loans' : 'None'}. Your interest coverage ratio is currently safe.</p>
                                </div>
                            </div>

                            <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-blue-600/20 mt-4 uppercase tracking-widest text-xs">
                                Generate Full Analysis
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
