"use client";

import React from 'react';
import Link from 'next/link';
import { useCurrency } from '../../lib/currency-context';
import { useNetWorth } from '../../lib/networth-context';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#ec4899', '#f43f5e', '#fb7185'];

export default function LiabilitiesPage() {
    const { currency } = useCurrency();
    const { data } = useNetWorth();

    const liabilityCategories = [
        { name: 'Housing Loans', value: data.liabilities.loans.totalValue, icon: '🏠', color: '#ef4444', link: '/loans' },
        { name: 'Credit Cards', value: data.liabilities.creditCards.totalValue, icon: '💳', color: '#f59e0b', link: '/loans' },
    ].filter(cat => cat.value > 0);

    const totalLiabilities = data.totalLiabilities;

    // Calculate total EMI (if possible from context, otherwise mock or use totalValue for viz)
    const emiDetails = [
        { name: 'Loans EMI', value: data.liabilities.loans.items?.reduce((acc: number, l: any) => acc + parseFloat(l.emiAmount || 0), 0) || 0 },
        { name: 'Card EMI/Min', value: data.liabilities.creditCards.items?.reduce((acc: number, c: any) => acc + parseFloat(c.notes?.match(/EMI: (.*)/)?.[1] || 0), 0) || 0 }
    ];

    const totalEMI = emiDetails.reduce((acc, d) => acc + d.value, 0);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">⚖️ Liabilities Overview</h1>
                        <p className="text-slate-500 mt-2 text-lg">Comprehensive view of your debts and financial obligations</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div className="md:col-span-2 bg-gradient-to-br from-red-600 via-rose-600 to-orange-600 p-8 rounded-3xl text-white shadow-xl shadow-red-500/20">
                        <div className="text-red-100 text-sm font-bold uppercase tracking-wider mb-2">Total Combined Liabilities</div>
                        <div className="text-5xl font-black">{currency.symbol} {totalLiabilities.toLocaleString()}</div>
                        <div className="mt-6 flex gap-4">
                            <div className="px-4 py-2 bg-white/10 rounded-xl backdrop-blur-md text-sm font-bold">
                                {liabilityCategories.length} Active Accounts
                            </div>
                            <div className="px-4 py-2 bg-white/10 rounded-xl backdrop-blur-md text-sm font-bold">
                                Debt-to-Asset: {data.totalAssets > 0 ? ((totalLiabilities / data.totalAssets) * 100).toFixed(1) : 0}%
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-7 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                        <div className="text-slate-400 text-sm font-bold uppercase tracking-wider">Monthly Commitment</div>
                        <div className="text-3xl font-black text-rose-600 mt-1">
                            {currency.symbol} {totalEMI.toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-7 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                        <div className="text-slate-400 text-sm font-bold uppercase tracking-wider">Credit Health</div>
                        <div className="text-3xl font-black text-emerald-500 mt-1">
                            Good
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                    <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8">Liability Distribution</h3>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={liabilityCategories}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={5}
                                    >
                                        {liabilityCategories.map((entry, index) => (
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
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8">Monthly EMI Split</h3>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={emiDetails}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        formatter={(value: number) => [`${currency.symbol} ${value.toLocaleString()}`, 'Monthly Value']}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" fill="#ef4444" radius={[8, 8, 0, 0]} barSize={60} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-8 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Active Obligations</h2>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {liabilityCategories.map((cat) => (
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
                                        <div className="font-black text-xl text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{cat.name}</div>
                                        <div className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-wider">
                                            {cat.name === 'Housing Loans' ? `${data.liabilities.loans.items?.length || 0} active loans` : `${data.liabilities.creditCards.items?.length || 0} cards`}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-8">
                                    <div>
                                        <div className="text-2xl font-black text-slate-900 dark:text-white">{currency.symbol} {cat.value.toLocaleString()}</div>
                                        <div className="text-red-500 text-sm font-bold mt-1 text-right">Manage Details →</div>
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
