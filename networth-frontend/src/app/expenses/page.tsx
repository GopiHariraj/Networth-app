"use client";

import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../lib/currency-context';
import { financialDataApi } from '../../lib/api/financial-data';
import { PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

interface Expense {
    id: string;
    date: string;
    amount: number;
    currency: string;
    category: string;
    merchant?: string;
    paymentMethod?: string;
    accountId?: string;
    recurrence: string;
    notes?: string;
    source: string;
}

const DEFAULT_CATEGORIES = [
    'Groceries', 'Restaurants', 'Transport', 'Fuel', 'Utilities (DEWA)',
    'Rent/EMI', 'School Fees', 'Insurance', 'Self-care', 'Shopping',
    'Entertainment', 'Medical', 'Travel', 'Misc'
];

const PAYMENT_METHODS = ['cash', 'bank', 'credit_card'];
const RECURRENCE_OPTIONS = ['one-time', 'monthly', 'yearly'];

export default function ExpensesPage() {
    const { currency } = useCurrency();
    const [activeTab, setActiveTab] = useState('daily');
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        currency: 'AED',
        category: 'Groceries',
        merchant: '',
        paymentMethod: 'cash',
        accountId: '',
        recurrence: 'one-time',
        notes: ''
    });

    // AI Text Parser state
    const [aiText, setAiText] = useState('');
    const [aiParsedItems, setAiParsedItems] = useState<any[]>([]);
    const [showAiPreview, setShowAiPreview] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);

    // Load expenses from API
    const fetchExpenses = async () => {
        try {
            setIsLoading(true);
            const res = await financialDataApi.expenses.getAll();
            setExpenses(res.data.map((e: any) => ({
                ...e,
                amount: parseFloat(e.amount)
            })));
        } catch (e) {
            console.error('Failed to load expenses', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    // Helpers
    const getToday = () => new Date().toISOString().split('T')[0];
    const getTodayTotal = () => expenses.filter(e => e.date === getToday()).reduce((sum, e) => sum + e.amount, 0);
    const getMonthTotal = () => {
        const now = new Date();
        return expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
        }).reduce((sum, e) => sum + e.amount, 0);
    };
    const getYearTotal = () => {
        const now = new Date();
        return expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getFullYear() === now.getFullYear();
        }).reduce((sum, e) => sum + e.amount, 0);
    };

    // Handle manual entry
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        const payload = {
            ...formData,
            amount: parseFloat(formData.amount),
            periodTag: 'monthly' // Default for now
        };

        try {
            if (editingId) {
                await financialDataApi.expenses.update(editingId, payload);
                setEditingId(null);
            } else {
                await financialDataApi.expenses.create(payload);
            }

            fetchExpenses();

            // Reset form
            setFormData({
                date: new Date().toISOString().split('T')[0],
                amount: '',
                currency: 'AED',
                category: 'Groceries',
                merchant: '',
                paymentMethod: 'cash',
                accountId: '',
                recurrence: 'one-time',
                notes: ''
            });
            alert(editingId ? 'Expense updated!' : 'Expense added!');
        } catch (err) {
            console.error(err);
            alert('Failed to save expense');
        }
    };

    const handleEdit = (expense: Expense) => {
        setEditingId(expense.id);
        const expenseDate = new Date(expense.date).toISOString().split('T')[0];
        setFormData({
            date: expenseDate,
            amount: expense.amount.toString(),
            currency: expense.currency,
            category: expense.category,
            merchant: expense.merchant || '',
            paymentMethod: expense.paymentMethod || 'cash',
            accountId: expense.accountId || '',
            recurrence: expense.recurrence,
            notes: expense.notes || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this expense?')) {
            try {
                await financialDataApi.expenses.delete(id);
                fetchExpenses();
            } catch (err) {
                alert('Failed to delete expense');
            }
        }
    };

    // OpenAI AI text parsing
    const handleAiAnalyze = async () => {
        if (!aiText.trim()) return;

        setIsAiLoading(true);

        try {
            const result = await financialDataApi.expenses.parseAi(aiText);

            if (result.data.error) {
                alert('Error: ' + result.data.error);
                setIsAiLoading(false);
                return;
            }

            if (result.data.items && result.data.items.length > 0) {
                setAiParsedItems(result.data.items);
                setShowAiPreview(true);
            } else {
                alert('No expenses detected in the text. Please try again with more details.');
            }
        } catch (error) {
            console.error('AI parsing error:', error);
            alert('Failed to parse expenses. Please check your OpenAI API key and try again.');
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleAiConfirm = async () => {
        try {
            setIsAiLoading(true);
            // Save sequentially (backend doesn't have bulk create)
            for (const item of aiParsedItems) {
                await financialDataApi.expenses.create({
                    date: item.date,
                    amount: parseFloat(item.amount),
                    currency: item.currency || 'AED',
                    category: item.category || 'Misc',
                    merchant: item.merchant,
                    paymentMethod: item.paymentMethod || 'cash',
                    recurrence: 'one-time',
                    periodTag: 'monthly',
                    notes: item.notes,
                    source: 'gemini_text'
                });
            }

            fetchExpenses();
            setAiText('');
            setAiParsedItems([]);
            setShowAiPreview(false);
            alert('✅ Expenses saved successfully!');
        } catch (err) {
            alert('Failed to save some expenses');
        } finally {
            setIsAiLoading(false);
        }
    };

    const filteredExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        const today = new Date();

        switch (activeTab) {
            case 'daily':
                return e.date.split('T')[0] === getToday();
            case 'monthly':
                return expenseDate.getMonth() === today.getMonth() &&
                    expenseDate.getFullYear() === today.getFullYear();
            case 'yearly':
                return expenseDate.getFullYear() === today.getFullYear();
            default:
                return true;
        }
    });

    // Charts Data
    const categoryData = filteredExpenses.reduce((acc: any, exp) => {
        const existing = acc.find((item: any) => item.name === exp.category);
        if (existing) {
            existing.value += exp.amount;
        } else {
            acc.push({ name: exp.category, value: exp.amount });
        }
        return acc;
    }, []).sort((a: any, b: any) => b.value - a.value);

    const paymentMethodData = filteredExpenses.reduce((acc: any, exp) => {
        const method = exp.paymentMethod || 'other';
        const existing = acc.find((item: any) => item.name === method);
        if (existing) {
            existing.value += exp.amount;
        } else {
            acc.push({ name: method, value: exp.amount });
        }
        return acc;
    }, []);

    const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

    const renderInsights = () => {
        const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
        const topCategory = categoryData[0] || { name: 'None', value: 0 };

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                            <span>🥧</span> Spending by Category
                        </h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {categoryData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => [`${currency.symbol} ${value.toLocaleString()}`, 'Spent']}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                            <span>💳</span> Payment Methods
                        </h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={paymentMethodData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        formatter={(value: number) => [`${currency.symbol} ${value.toLocaleString()}`, 'Spent']}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl p-6">
                        <div className="text-blue-600 dark:text-blue-400 font-bold mb-2">Highest Expense</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white uppercase">{topCategory.name}</div>
                        <div className="text-sm text-slate-500 mt-1">{currency.symbol} {topCategory.value.toLocaleString()}</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 rounded-2xl p-6">
                        <div className="text-purple-600 dark:text-purple-400 font-bold mb-2">Average Daily</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{currency.symbol} {(total / (activeTab === 'monthly' ? 30 : activeTab === 'yearly' ? 365 : 1)).toLocaleString()}</div>
                        <div className="text-sm text-slate-500 mt-1">Based on selection</div>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-6">
                        <div className="text-emerald-600 dark:text-emerald-400 font-bold mb-2">Total Managed</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{filteredExpenses.length} Items</div>
                        <div className="text-sm text-slate-500 mt-1">In this view</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-10 flex flex-wrap justify-between items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <span>💸</span> Expenses Management
                        </h1>
                        <p className="text-slate-500 mt-2">Track and manage all your expenses with AI-powered tools</p>
                    </div>

                    <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
                        {['daily', 'monthly', 'yearly', 'insights'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-3xl p-8 text-white shadow-xl shadow-rose-200 dark:shadow-none">
                        <div className="text-sm opacity-90 font-medium tracking-wide uppercase">Today's Expenses</div>
                        <div className="text-4xl font-bold mt-3 font-mono">{currency.symbol} {getTodayTotal().toLocaleString()}</div>
                        <div className="mt-4 flex items-center gap-2 text-xs bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                            <span>📅</span> {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500 font-medium tracking-wide uppercase">This Month</div>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white mt-3 font-mono">{currency.symbol} {getMonthTotal().toLocaleString()}</div>
                        <div className="mt-4 text-xs font-semibold text-rose-500">
                            Managed {expenses.filter(e => {
                                const d = new Date(e.date);
                                const now = new Date();
                                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                            }).length} transactions
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500 font-medium tracking-wide uppercase">This Year</div>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white mt-3 font-mono">{currency.symbol} {getYearTotal().toLocaleString()}</div>
                        <div className="mt-4 text-xs font-semibold text-emerald-500">
                            Tracked across {new Set(expenses.map(e => e.category)).size} categories
                        </div>
                    </div>
                </div>

                {activeTab === 'insights' ? (
                    renderInsights()
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* Left Column - Forms */}
                        <div className="space-y-8">
                            {/* Manual Entry Form */}
                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
                                <h2 className="text-2xl font-bold mb-8 text-slate-900 dark:text-white flex items-center gap-3">
                                    <span className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-xl">
                                        {editingId ? '✏️' : '➕'}
                                    </span>
                                    {editingId ? 'Edit Expenditure' : 'Add New Expense'}
                                </h2>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Date *</label>
                                            <input
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                required
                                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Amount ({currency.code}) *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                placeholder="0.00"
                                                required
                                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-lg"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Category *</label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                                            >
                                                {categories.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Payment Method</label>
                                            <select
                                                value={formData.paymentMethod}
                                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                                            >
                                                <option value="cash">💵 Cash</option>
                                                <option value="bank">🏦 Bank Transfer</option>
                                                <option value="credit_card">💳 Credit Card</option>
                                                <option value="debit_card">💳 Debit Card</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Merchant / Location</label>
                                        <input
                                            type="text"
                                            value={formData.merchant}
                                            onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                                            placeholder="e.g., Carrefour, Spinneys, ADDC"
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Transaction Notes</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            rows={2}
                                            placeholder="Add details about this expense..."
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        {editingId && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingId(null);
                                                    setFormData({
                                                        date: new Date().toISOString().split('T')[0],
                                                        amount: '',
                                                        currency: 'AED',
                                                        category: 'Groceries',
                                                        merchant: '',
                                                        paymentMethod: 'cash',
                                                        accountId: '',
                                                        recurrence: 'one-time',
                                                        notes: ''
                                                    });
                                                }}
                                                className="flex-1 px-8 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            className="flex-[2] px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-600/20"
                                        >
                                            {editingId ? '💾 Update Transaction' : '🚀 Add to Records'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* AI Text Parser */}
                            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl">
                                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                    <span className="text-3xl">✨</span> AI Smart Entry
                                </h2>
                                <p className="text-indigo-100 mb-6 text-sm opacity-90">Paste any text (SMS, receipt bill, or note) and AI will extract multiple expenses automatically.</p>

                                <div className="relative mb-6">
                                    <textarea
                                        value={aiText}
                                        onChange={(e) => setAiText(e.target.value)}
                                        rows={4}
                                        placeholder="Example: Spent 450 AED at Lulu for groceries. Paid 156 for taxi. Also 25 for coffee today."
                                        className="w-full px-5 py-5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:ring-2 focus:ring-white/40 outline-none resize-none backdrop-blur-sm"
                                    />
                                    {isAiLoading && (
                                        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
                                            <div className="flex gap-2">
                                                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleAiAnalyze}
                                    disabled={isAiLoading || !aiText.trim()}
                                    className="w-full px-8 py-5 bg-white text-indigo-700 font-extrabold rounded-2xl transition-all hover:bg-indigo-50 shadow-xl disabled:opacity-50"
                                >
                                    {isAiLoading ? '🤖 Analyzing Content...' : '🪄 Magic Extract with AI'}
                                </button>

                                {/* AI Preview Modal/Overlay */}
                                {showAiPreview && aiParsedItems.length > 0 && (
                                    <div className="mt-8 p-6 bg-white/10 rounded-2xl border border-white/20 animate-in zoom-in duration-300">
                                        <h3 className="font-bold text-white mb-4 flex items-center justify-between">
                                            <span>📋 Found {aiParsedItems.length} Expenses</span>
                                            <span className="text-xs bg-emerald-500 text-white px-2 py-1 rounded">Smart Detected</span>
                                        </h3>
                                        <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {aiParsedItems.map((item, idx) => (
                                                <div key={idx} className="bg-white rounded-xl p-4 text-slate-900 shadow-sm border-l-4 border-indigo-500">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="font-bold">{item.category}</div>
                                                            <div className="text-xs text-slate-500 mt-1">{item.merchant || 'Merchant'} • {new Date(item.date).toLocaleDateString()}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold text-indigo-600">{item.currency} {item.amount}</div>
                                                            <div className="text-[10px] text-slate-400 uppercase font-bold">{item.paymentMethod}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setShowAiPreview(false)}
                                                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
                                            >
                                                Discard
                                            </button>
                                            <button
                                                onClick={handleAiConfirm}
                                                className="flex-[2] px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/40"
                                            >
                                                ✓ Confirm & Record All
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Transactions List */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden sticky top-8">
                            <div className="p-8 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>🧾</span> Recent History
                                    <span className="text-sm font-medium text-slate-400 ml-2">({filteredExpenses.length})</span>
                                </h2>
                                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full uppercase tracking-wider">
                                    Sorted by Date
                                </div>
                            </div>

                            {filteredExpenses.length === 0 ? (
                                <div className="p-20 text-center">
                                    <div className="text-7xl mb-6">🏜️</div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No records found</h3>
                                    <p className="text-slate-500 max-w-xs mx-auto text-sm">You haven't added any expenses for this period yet. Use the manual form or AI parser to begin.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[850px] overflow-y-auto custom-scrollbar">
                                    {filteredExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
                                        <div key={expense.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all group">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase text-sm tracking-tight">{expense.category}</div>
                                                        {expense.merchant && (
                                                            <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md font-bold text-slate-500 dark:text-slate-400 uppercase">
                                                                {expense.merchant}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs font-medium text-slate-400 flex items-center gap-2">
                                                        <span>📅 {new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                        <span>•</span>
                                                        <span className="uppercase">{expense.paymentMethod?.replace('_', ' ')}</span>
                                                    </div>
                                                    {expense.notes && (
                                                        <div className="text-xs text-slate-500 mt-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800 italic">
                                                            "{expense.notes}"
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-mono font-bold text-rose-500 group-hover:scale-110 transition-transform origin-right text-xl">
                                                        -{currency.symbol} {expense.amount.toLocaleString()}
                                                    </div>
                                                    <div className="flex gap-1 justify-end mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleEdit(expense)}
                                                            className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-md transition-colors"
                                                            title="Edit"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(expense.id)}
                                                            className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-md transition-colors"
                                                            title="Delete"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}
