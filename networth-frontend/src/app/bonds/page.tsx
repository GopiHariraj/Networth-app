"use client";

import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../lib/currency-context';
import { useNetWorth } from '../../lib/networth-context';
import { financialDataApi } from '../../lib/api/financial-data';
import { PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Bond {
    id: string;
    issuer: string;
    name: string;
    interestRate: number;
    faceValue: number;
    currentValue: number;
    maturityDate: string;
    purchaseDate: string;
}

export default function BondsPage() {
    const { currency } = useCurrency();
    const { refreshNetWorth } = useNetWorth();
    const [bonds, setBonds] = useState<Bond[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'Portfolio' | 'Add/Edit'>('Portfolio');

    const [formData, setFormData] = useState({
        companyName: '',
        bondType: 'Corporate',
        interestRate: '',
        faceValue: '',
        currentValue: '',
        maturityDate: '',
        purchaseDate: new Date().toISOString().split('T')[0]
    });

    const fetchBonds = async () => {
        try {
            setIsLoading(true);
            const res = await financialDataApi.bondAssets.getAll();
            setBonds(res.data.map((b: any) => ({
                id: b.id,
                issuer: b.issuer,
                name: b.name,
                interestRate: parseFloat(b.interestRate),
                faceValue: parseFloat(b.faceValue),
                currentValue: parseFloat(b.currentValue),
                maturityDate: b.maturityDate,
                purchaseDate: b.createdAt
            })));
        } catch (e) {
            console.error('Failed to load bonds', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBonds();
    }, []);

    const bondTypes = [
        'Corporate',
        'Government',
        'Municipal',
        'Treasury',
        'High Yield',
        'Investment Grade',
        'Zero Coupon',
        'Convertible'
    ];

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddBond = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.companyName || !formData.interestRate || !formData.faceValue || !formData.currentValue || !formData.maturityDate) {
            alert('Please fill in all required fields');
            return;
        }

        const payload = {
            issuer: formData.companyName,
            name: formData.bondType,
            interestRate: parseFloat(formData.interestRate),
            faceValue: parseFloat(formData.faceValue),
            currentValue: parseFloat(formData.currentValue),
            maturityDate: new Date(formData.maturityDate).toISOString(),
            notes: `Purchase Date: ${formData.purchaseDate}`
        };

        try {
            setIsLoading(true);
            if (editingId) {
                await financialDataApi.bondAssets.update(editingId, payload);
                alert('✅ Bond updated successfully!');
            } else {
                await financialDataApi.bondAssets.create(payload);
                alert('✅ Bond added successfully!');
            }

            await fetchBonds();
            await refreshNetWorth();
            handleCancel();
            setActiveTab('Portfolio');
        } catch (err) {
            alert('Failed to save bond');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (bond: Bond) => {
        setEditingId(bond.id);
        setFormData({
            companyName: bond.issuer,
            bondType: bond.name,
            interestRate: bond.interestRate.toString(),
            faceValue: bond.faceValue.toString(),
            currentValue: bond.currentValue.toString(),
            maturityDate: bond.maturityDate.split('T')[0],
            purchaseDate: bond.purchaseDate.split('T')[0]
        });
        setActiveTab('Add/Edit');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({
            companyName: '',
            bondType: 'Corporate',
            interestRate: '',
            faceValue: '',
            currentValue: '',
            maturityDate: '',
            purchaseDate: new Date().toISOString().split('T')[0]
        });
    };

    const handleDeleteBond = async (id: string) => {
        if (confirm('Are you sure you want to delete this bond?')) {
            try {
                await financialDataApi.bondAssets.delete(id);
                await fetchBonds();
                await refreshNetWorth();
            } catch (err) {
                alert('Failed to delete bond');
            }
        }
    };

    const getTotalValue = () => {
        return bonds.reduce((sum, bond) => sum + bond.currentValue, 0);
    };

    const getTotalFaceValue = () => {
        return bonds.reduce((sum, bond) => sum + bond.faceValue, 0);
    };

    const getAverageInterestRate = () => {
        if (bonds.length === 0) return 0;
        const total = bonds.reduce((sum, bond) => sum + bond.interestRate, 0);
        return total / bonds.length;
    };

    const getDaysToMaturity = (maturityDate: string) => {
        const today = new Date();
        const maturity = new Date(maturityDate);
        const diffTime = maturity.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Chart Data
    const allocationByIssuer = bonds.reduce((acc: any, bond) => {
        const existing = acc.find((item: any) => item.name === bond.issuer);
        if (existing) {
            existing.value += bond.currentValue;
        } else {
            acc.push({ name: bond.issuer, value: bond.currentValue });
        }
        return acc;
    }, []);

    const allocationByType = bonds.reduce((acc: any, bond) => {
        const existing = acc.find((item: any) => item.name === bond.name);
        if (existing) {
            existing.value += bond.currentValue;
        } else {
            acc.push({ name: bond.name, value: bond.currentValue });
        }
        return acc;
    }, []);

    const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-10 flex flex-wrap justify-between items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">📜 Bond Portfolio</h1>
                        <p className="text-slate-500 mt-2">Track your fixed income investments and maturity dates</p>
                    </div>
                    <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        {['Portfolio', 'Add/Edit'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {tab === 'Add/Edit' ? (editingId ? '✏️ Edit Bond' : '➕ Add Bond') : '📊 Portfolio'}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                        <div className="text-sm opacity-90 font-medium">Total Current Value</div>
                        <div className="text-3xl font-bold mt-2 font-mono">{currency.symbol} {getTotalValue().toLocaleString()}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500 font-medium">Total Face Value</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 font-mono">{currency.symbol} {getTotalFaceValue().toLocaleString()}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500 font-medium">Average Yield</div>
                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">{getAverageInterestRate().toFixed(2)}%</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500 font-medium">Bonds Count</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{bonds.length} Assets</div>
                    </div>
                </div>

                {activeTab === 'Portfolio' ? (
                    <div className="space-y-8">
                        {/* Charts Section */}
                        {bonds.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                                    <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                                        <span>🏢</span> Allocation by Issuer
                                    </h3>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={allocationByIssuer}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={5}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {allocationByIssuer.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value: number) => [`${currency.symbol} ${value.toLocaleString()}`, 'Value']}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                                    <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                                        <span>📂</span> Allocation by Bond Type
                                    </h3>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={allocationByType}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                                <YAxis axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    cursor={{ fill: '#f1f5f9' }}
                                                    formatter={(value: number) => [`${currency.symbol} ${value.toLocaleString()}`, 'Value']}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                />
                                                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bonds List */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">📊 Asset Inventory</h2>
                                <span className="text-sm font-medium text-slate-500">{bonds.length} active bonds</span>
                            </div>

                            {bonds.length === 0 ? (
                                <div className="p-20 text-center">
                                    <div className="text-7xl mb-6">📜</div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No bonds added yet</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto mb-8">Start tracking your fixed income investments by adding your first bond.</p>
                                    <button
                                        onClick={() => setActiveTab('Add/Edit')}
                                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                                    >
                                        ➕ Add First Bond
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Company / Issuer</th>
                                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bond Type</th>
                                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Yield (%)</th>
                                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Current Value</th>
                                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Maturity Status</th>
                                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                            {bonds.map((bond) => {
                                                const daysToMaturity = getDaysToMaturity(bond.maturityDate);
                                                const isMatured = daysToMaturity < 0;

                                                return (
                                                    <tr key={bond.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors group">
                                                        <td className="px-6 py-5">
                                                            <div className="font-bold text-slate-900 dark:text-white">{bond.issuer}</div>
                                                            <div className="text-xs text-slate-500 mt-1">Purchased: {new Date(bond.purchaseDate).toLocaleDateString()}</div>
                                                        </td>
                                                        <td className="px-6 py-5 text-center">
                                                            <span className="inline-flex px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold border border-indigo-100 dark:border-indigo-900/50">
                                                                {bond.name}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                            {bond.interestRate.toFixed(2)}%
                                                        </td>
                                                        <td className="px-6 py-5 text-right">
                                                            <div className="font-bold text-slate-900 dark:text-white font-mono">
                                                                {currency.symbol} {bond.currentValue.toLocaleString()}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 mt-1">Face: {currency.symbol}{bond.faceValue.toLocaleString()}</div>
                                                        </td>
                                                        <td className="px-6 py-5 text-center">
                                                            <div className={`text-sm font-bold ${isMatured ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                                                                {new Date(bond.maturityDate).toLocaleDateString()}
                                                            </div>
                                                            <div className={`text-[10px] font-medium mt-1 uppercase ${isMatured ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-500 dark:text-indigo-400'}`}>
                                                                {isMatured ? 'Matured' : `${daysToMaturity} days left`}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 text-right">
                                                            <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => handleEdit(bond)}
                                                                    className="p-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                                                                    title="Edit Bond"
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteBond(bond.id)}
                                                                    className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-lg transition-colors"
                                                                    title="Delete Bond"
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
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
                            <h2 className="text-2xl font-bold mb-8 text-slate-900 dark:text-white flex items-center gap-3">
                                <span className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-xl">
                                    {editingId ? '✏️' : '➕'}
                                </span>
                                {editingId ? 'Edit Bond Investment' : 'Add New Bond Asset'}
                            </h2>

                            <form onSubmit={handleAddBond} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            Issuer / Company Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.companyName}
                                            onChange={(e) => handleInputChange('companyName', e.target.value)}
                                            placeholder="e.g., US Treasury, Apple Inc."
                                            required
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            Bond Category
                                        </label>
                                        <select
                                            value={formData.bondType}
                                            onChange={(e) => handleInputChange('bondType', e.target.value)}
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                                        >
                                            {bondTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            Annual Yield (%) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.interestRate}
                                            onChange={(e) => handleInputChange('interestRate', e.target.value)}
                                            placeholder="e.g., 4.25"
                                            required
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            Face Value ({currency.code}) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.faceValue}
                                            onChange={(e) => handleInputChange('faceValue', e.target.value)}
                                            placeholder="10,000"
                                            required
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            Current Market Value ({currency.code}) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.currentValue}
                                            onChange={(e) => handleInputChange('currentValue', e.target.value)}
                                            placeholder="9,850"
                                            required
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            Maturity Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.maturityDate}
                                            onChange={(e) => handleInputChange('maturityDate', e.target.value)}
                                            required
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            Purchase Date
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.purchaseDate}
                                            onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6 mt-6 border-t border-slate-100 dark:border-slate-700">
                                    <button
                                        type="button"
                                        onClick={() => { handleCancel(); setActiveTab('Portfolio'); }}
                                        className="flex-1 px-8 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-[2] px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50"
                                    >
                                        {isLoading ? 'Processing...' : (editingId ? '💾 Update Bond' : '🚀 Add to Portfolio')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
