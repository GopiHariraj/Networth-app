"use client";

import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../lib/currency-context';
import { useNetWorth } from '../../lib/networth-context';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { financialDataApi } from '../../lib/api/financial-data';

interface BankAccount {
    id: string;
    accountName: string;
    bankName: string;
    currency: string;
    balance: number;
    accountType: string;
    lastUpdated: string;
    notes?: string;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function CashPage() {
    const { currency } = useCurrency();
    const { data, refreshNetWorth } = useNetWorth();
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [wallets, setWallets] = useState<BankAccount[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('Overview');

    const [formData, setFormData] = useState({
        accountName: '',
        bankName: '',
        currency: 'AED',
        balance: '',
        accountType: 'Savings',
        notes: ''
    });

    useEffect(() => {
        if (data.assets.cash.bankAccounts) {
            setBankAccounts(data.assets.cash.bankAccounts as BankAccount[]);
        }
        if (data.assets.cash.wallets) {
            setWallets(data.assets.cash.wallets as BankAccount[]);
        }
    }, [data.assets.cash.bankAccounts, data.assets.cash.wallets]);

    const getTotalBank = () => bankAccounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
    const getTotalWallet = () => wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);
    const getTotalCash = () => Number(getTotalBank()) + Number(getTotalWallet());

    const handleEdit = (account: BankAccount) => {
        setEditingId(account.id);
        setFormData({
            accountName: account.accountName,
            bankName: account.bankName,
            currency: account.currency,
            balance: account.balance.toString(),
            accountType: account.accountType,
            notes: account.notes || ''
        });
        setActiveTab('Manage Account');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.accountName || !formData.balance) {
            alert('Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                accountName: formData.accountName,
                bankName: formData.bankName || (formData.accountType === 'Wallet' ? 'Cash' : ''),
                currency: formData.currency,
                balance: parseFloat(formData.balance),
                accountType: formData.accountType,
                notes: formData.notes || ''
            };

            if (editingId) {
                await financialDataApi.bankAccounts.update(editingId, payload);
                setEditingId(null);
                alert('✅ Record updated successfully!');
            } else {
                await financialDataApi.bankAccounts.create(payload);
                alert('🚀 New record added!');
            }

            await refreshNetWorth();
            setFormData({ accountName: '', bankName: '', currency: 'AED', balance: '', accountType: 'Savings', notes: '' });
            setActiveTab('Overview');
        } catch (error) {
            alert('Failed to save. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this record?')) {
            try {
                await financialDataApi.bankAccounts.delete(id);
                await refreshNetWorth();
            } catch (error) {
                alert('Failed to delete. Please try again.');
            }
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({ accountName: '', bankName: '', currency: 'AED', balance: '', accountType: 'Savings', notes: '' });
        setActiveTab('Overview');
    };

    const allocationData = [
        { name: 'Bank Accounts', value: getTotalBank() },
        { name: 'Cash Wallets', value: getTotalWallet() }
    ].filter(item => item.value > 0);

    const accountsByType = [...bankAccounts, ...wallets].reduce((acc: any, curr) => {
        const existing = acc.find((item: any) => item.name === curr.accountType);
        if (existing) existing.value += curr.balance;
        else acc.push({ name: curr.accountType, value: curr.balance });
        return acc;
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-10 flex flex-wrap justify-between items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">💰</span>
                            Liquid Cash Assets
                        </h1>
                        <p className="text-slate-500 mt-2">Monitor your real-time liquidity across bank accounts and physical cash</p>
                    </div>

                    <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        {['Overview', 'Bank Accounts', 'Wallets', 'Manage Account'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-xl shadow-emerald-200 dark:shadow-none">
                        <div className="text-sm opacity-90 font-medium tracking-wide uppercase">Total Liquidity</div>
                        <div className="text-4xl font-bold mt-3 font-mono">{currency.symbol} {getTotalCash().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="mt-4 flex items-center gap-2 text-xs bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                            Across {bankAccounts.length + wallets.length} Records
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500 font-medium tracking-wide uppercase">Institutional</div>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white mt-3 font-mono">{currency.symbol} {getTotalBank().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="mt-2 text-xs text-emerald-500 font-bold">{bankAccounts.length} Bank Accounts</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500 font-medium tracking-wide uppercase">Physical / Wallets</div>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white mt-3 font-mono">{currency.symbol} {getTotalWallet().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="mt-2 text-xs text-emerald-500 font-bold">{wallets.length} Cash Wallets</div>
                    </div>
                </div>

                {activeTab === 'Overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="text-xl font-bold mb-8 text-slate-900 dark:text-white flex items-center gap-3">
                                <span className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">📊</span>
                                Store of Value
                            </h3>
                            <div className="h-[300px]">
                                {allocationData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={allocationData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5}>
                                                {allocationData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: number) => [`${currency.symbol} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Balance']}
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                            />
                                            <Legend iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400">No balance data available</div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="text-xl font-bold mb-8 text-slate-900 dark:text-white flex items-center gap-3">
                                <span className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">🏦</span>
                                Type Distribution
                            </h3>
                            <div className="h-[300px]">
                                {accountsByType.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={accountsByType} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5}>
                                                {accountsByType.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: number) => [`${currency.symbol} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Balance']}
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                            />
                                            <Legend iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400">No data available</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {(activeTab === 'Bank Accounts' || activeTab === 'Wallets') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {(activeTab === 'Bank Accounts' ? bankAccounts : wallets).length === 0 ? (
                            <div className="col-span-full py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
                                <div className="text-6xl mb-6">🏜️</div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No records found</h3>
                                <p className="text-slate-500 mb-8">Start tracking your {activeTab.toLowerCase()} today.</p>
                                <button
                                    onClick={() => setActiveTab('Manage Account')}
                                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg"
                                >
                                    Add New Record
                                </button>
                            </div>
                        ) : (
                            (activeTab === 'Bank Accounts' ? bankAccounts : wallets).map(account => (
                                <div key={account.id} className="group bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700 border-l-8 border-l-emerald-500">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{account.accountName}</h3>
                                            <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{account.bankName}</div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(account)} className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">✏️</button>
                                            <button onClick={() => handleDelete(account.id)} className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-lg">🗑️</button>
                                        </div>
                                    </div>
                                    <div className="mt-auto">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Available Balance</div>
                                        <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono">
                                            {currency.symbol}{account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                        <div className="mt-4 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{account.accountType}</span>
                                            <span className="text-[10px] text-slate-400 font-mono">Updated: {new Date(account.lastUpdated || Date.now()).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'Manage Account' && (
                    <div className="max-w-3xl mx-auto animate-in fade-in zoom-in duration-300">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
                            <h2 className="text-2xl font-bold mb-8 text-slate-900 dark:text-white flex items-center gap-3">
                                <span className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                                    {editingId ? '✏️' : '➕'}
                                </span>
                                {editingId ? 'Edit Financial Account' : 'Register New Asset'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Account Type</label>
                                        <select
                                            value={formData.accountType}
                                            onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all cursor-pointer"
                                        >
                                            <option value="Savings">Savings Account</option>
                                            <option value="Current">Current Account</option>
                                            <option value="Fixed Deposit">Fixed Deposit</option>
                                            <option value="Wallet">Cash Wallet</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            {formData.accountType === 'Wallet' ? 'Wallet Name *' : 'Account Name *'}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.accountName}
                                            onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                                            placeholder={formData.accountType === 'Wallet' ? 'e.g., Physical Cash' : 'e.g., Salary Account'}
                                            required
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        />
                                    </div>
                                    {formData.accountType !== 'Wallet' && (
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Bank / Institution Name *</label>
                                            <input
                                                type="text"
                                                value={formData.bankName}
                                                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                                placeholder="e.g., Emirates NBD, ADCB, HSBC"
                                                required={formData.accountType !== 'Wallet'}
                                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                            />
                                        </div>
                                    )}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Current Balance ({currency.code}) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.balance}
                                            onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                                            placeholder="0.00"
                                            required
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-xl"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Additional Notes</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="Notes about this account..."
                                            rows={2}
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6 border-t border-slate-100 dark:border-slate-700">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="flex-1 px-8 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-[2] px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-2xl transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                                    >
                                        {isLoading ? 'Processing...' : (editingId ? '💾 Save Changes' : '➕ Confirm Registration')}
                                    </button>
                                </div>
                            </form>
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
