"use client";

import React from 'react';
import Link from 'next/link';
import { useCurrency } from '../../lib/currency-context';
import { useNetWorth } from '../../lib/networth-context';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

export default function AssetsPage() {
    const { currency } = useCurrency();
    const { data } = useNetWorth();

    const assetCategories = [
        { name: 'Property', value: data.assets.property.totalValue, icon: '🏠', color: '#3b82f6', link: '/property' },
        { name: 'Stocks', value: data.assets.stocks.totalValue, icon: '📈', color: '#10b981', link: '/stocks' },
        { name: 'Mutual Funds', value: data.assets.mutualFunds.totalValue, icon: '📊', color: '#8b5cf6', link: '/mutual-funds' },
        { name: 'Cash & Bank', value: data.assets.cash.totalCash, icon: '💰', color: '#f59e0b', link: '/cash' },
        { name: 'Gold', value: data.assets.gold.totalValue, icon: '🥇', color: '#eab308', link: '/gold' },
        { name: 'Bonds', value: data.assets.bonds.totalValue, icon: '📜', color: '#ec4899', link: '/bonds' }
    ].filter(cat => cat.value > 0);

    const totalAssets = data.totalAssets;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">💼 Assets Overview</h1>
                        <p className="text-slate-500 mt-2 text-lg">Detailed breakdown and allocation of your total wealth assets</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-500/20">
                        <div className="text-blue-100 text-sm font-bold uppercase tracking-wider mb-2">Total Combined Assets</div>
                        <div className="text-5xl font-black">{currency.symbol} {totalAssets.toLocaleString()}</div>
                        <div className="mt-6 flex gap-4">
                            <div className="px-4 py-2 bg-white/10 rounded-xl backdrop-blur-md text-sm font-bold">
                                {assetCategories.length} Categories
                            </div>
                            <div className="px-4 py-2 bg-white/10 rounded-xl backdrop-blur-md text-sm font-bold">
                                Health: Excellent
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-7 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                        <div className="text-slate-400 text-sm font-bold uppercase tracking-wider">Most Value In</div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                            {assetCategories.length > 0 ? assetCategories.sort((a, b) => b.value - a.value)[0].name : 'N/A'}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-7 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                        <div className="text-slate-400 text-sm font-bold uppercase tracking-wider">Portfolio Liquid</div>
                        <div className="text-3xl font-black text-emerald-500 mt-1">
                            {totalAssets > 0 ? ((data.assets.cash.totalCash / totalAssets) * 100).toFixed(1) : 0}%
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                    <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8">Asset Allocation</h3>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={assetCategories}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={5}
                                    >
                                        {assetCategories.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => [`${currency.symbol} ${value.toLocaleString()}`, 'Value']}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8">Value by Category</h3>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={assetCategories}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${currency.symbol}${value / 1000}k`} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        formatter={(value: number) => [`${currency.symbol} ${value.toLocaleString()}`, 'Value']}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={50}>
                                        {assetCategories.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-8 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Category Breakdown</h2>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {assetCategories.map((cat) => (
                            <Link
                                href={cat.link}
                                key={cat.name}
                                className="flex items-center justify-between p-8 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group"
                            >
                                <div className="flex items-center gap-6">
                                    <div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-slate-100 dark:border-slate-700/50"
                                        style={{ backgroundColor: `${cat.color}15` }}
                                    >
                                        {cat.icon}
                                    </div>
                                    <div>
                                        <div className="font-black text-xl text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{cat.name}</div>
                                        <div className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-wider">
                                            {((cat.value / totalAssets) * 100).toFixed(1)}% of total assets
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-8">
                                    <div>
                                        <div className="text-2xl font-black text-slate-900 dark:text-white">{currency.symbol} {cat.value.toLocaleString()}</div>
                                        <div className="text-emerald-500 text-sm font-bold mt-1 text-right">View Details →</div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
