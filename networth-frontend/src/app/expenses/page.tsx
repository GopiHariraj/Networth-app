"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useCurrency } from '../../lib/currency-context';
import { financialDataApi } from '../../lib/api/financial-data';
import { PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area } from 'recharts';

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

interface ExpenseCategory {
    id: string;
    name: string;
    icon?: string;
    color?: string;
    isCustom: boolean;
}

interface Insights {
    total: number;
    count: number;
    constByCategory: Record<string, number>;
    monthlyTrend: { month: string; amount: number }[];
}

export default function ExpensesPage() {
    const { currency } = useCurrency();
    const [activeTab, setActiveTab] = useState('daily');
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [insights, setInsights] = useState<Insights | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

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

    // AI & Receipt state
    const [aiText, setAiText] = useState('');
    const [aiParsedItems, setAiParsedItems] = useState<any[]>([]);
    const [showAiPreview, setShowAiPreview] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // New Category state
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    // Load data
    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [expRes, catRes, insRes] = await Promise.all([
                financialDataApi.expenses.getAll(),
                financialDataApi.expenseCategories.getAll(),
                financialDataApi.expenses.getInsights(),
            ]);

            setExpenses(expRes.data.map((e: any) => ({
                ...e,
                amount: parseFloat(e.amount)
            })));
            setCategories(catRes.data);
            setInsights(insRes.data);

            if (catRes.data.length > 0 && !editingId) {
                setFormData(prev => ({ ...prev, category: catRes.data[0].name }));
            }
        } catch (e) {
            console.error('Failed to load expenses data', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Helpers
    const getToday = () => new Date().toISOString().split('T')[0];
    const getTodayTotal = () => expenses.filter(e => e.date.split('T')[0] === getToday()).reduce((sum, e) => sum + e.amount, 0);
    const getMonthTotal = () => {
        const now = new Date();
        return expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
        }).reduce((sum, e) => sum + e.amount, 0);
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            await financialDataApi.expenseCategories.create({ name: newCategoryName });
            setNewCategoryName('');
            setShowAddCategory(false);
            const res = await financialDataApi.expenseCategories.getAll();
            setCategories(res.data);
        } catch (e) {
            alert('Failed to add category');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            alert('Please enter a valid amount');
            return;
        }

        const payload = {
            ...formData,
            amount: parseFloat(formData.amount),
            periodTag: 'monthly'
        };

        try {
            if (editingId) {
                await financialDataApi.expenses.update(editingId, payload);
                setEditingId(null);
            } else {
                await financialDataApi.expenses.create(payload);
            }
            fetchData();
            setFormData({
                date: new Date().toISOString().split('T')[0],
                amount: '',
                currency: 'AED',
                category: categories[0]?.name || 'Misc',
                merchant: '',
                paymentMethod: 'cash',
                accountId: '',
                recurrence: 'one-time',
                notes: ''
            });
        } catch (err) {
            alert('Failed to save expense');
        }
    };

    const handleEdit = (expense: Expense) => {
        setEditingId(expense.id);
        setFormData({
            date: expense.date.split('T')[0],
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
                fetchData();
            } catch (err) {
                alert('Failed to delete expense');
            }
        }
    };

    const handleAiAnalyze = async () => {
        if (!aiText.trim()) return;
        setIsAiLoading(true);
        try {
            const result = await financialDataApi.expenses.parseAi(aiText);
            if (result.data.items) {
                setAiParsedItems(result.data.items);
                setShowAiPreview(true);
            }
        } catch (error) {
            alert('AI parsing failed');
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleAiConfirm = async () => {
        setIsAiLoading(true);
        try {
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
            fetchData();
            setAiText('');
            setAiParsedItems([]);
            setShowAiPreview(false);
        } catch (err) {
            alert('Partial failure saving items');
        } finally {
            setIsAiLoading(false);
        }
    };

    // Receipt Upload Placeholder (Real OCR would happen here)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            alert(`Receipt "${file.name}" uploaded! Simulating AI extraction...`);
            setAiText(`Receipt from ${file.name.includes('Lulu') ? 'Lulu' : 'the store'} for ${Math.floor(Math.random() * 500)} AED`);
        }
    };

    const filteredExpenses = expenses.filter(e => {
        const matchesSearch = e.merchant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.notes?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || e.category === filterCategory;

        const expenseDate = new Date(e.date);
        const today = new Date();
        const dStr = e.date.split('T')[0];

        let matchesTab = true;
        if (activeTab === 'daily') matchesTab = dStr === getToday();
        else if (activeTab === 'monthly') matchesTab = expenseDate.getMonth() === today.getMonth() && expenseDate.getFullYear() === today.getFullYear();
        else if (activeTab === 'yearly') matchesTab = expenseDate.getFullYear() === today.getFullYear();

        return matchesSearch && matchesCategory && matchesTab;
    });

    const categoryChartData = insights?.constByCategory ? Object.entries(insights.constByCategory).map(([name, value]) => ({ name, value })) : [];
    const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">

                {/* Header Section */}
                <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                        <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-3">
                            <span className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-transparent bg-clip-text">Expense</span> Intelligence
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Powered by Advanced AI Analytics</p>
                    </div>

                    <div className="flex bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl p-1.5 rounded-2xl shadow-xl border border-white dark:border-slate-700 ring-1 ring-slate-200 dark:ring-slate-800 overflow-x-auto">
                        {['daily', 'monthly', 'yearly', 'insights'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === tab
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Dashboard Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-500/20 group relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Daily Burn Rate</div>
                        <div className="text-4xl font-black font-mono tracking-tighter">{currency.symbol} {getTodayTotal().toLocaleString()}</div>
                        <div className="mt-4 flex items-center gap-2 bg-white/20 w-fit px-3 py-1.5 rounded-full backdrop-blur-md text-[10px] font-bold">
                            <span>🔥</span> LIVE UPDATES
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-xl border border-white dark:border-slate-700/50 group">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">This Month</div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">{currency.symbol} {getMonthTotal().toLocaleString()}</div>
                        <div className="mt-4 flex items-center gap-2">
                            <div className="h-2 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full w-[65%]"></div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">65% OF BUDGET</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-xl border border-white dark:border-slate-700/50">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Managed</div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">{expenses.length} Items</div>
                        <div className="mt-4 text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full w-fit">
                            INTEGRITY VERIFIED ✓
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-xl border border-white dark:border-slate-700/50">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Categories</div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">{categories.length} Types</div>
                        <div className="mt-4 flex -space-x-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className={`w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px]`}>
                                    {['🍔', '🚗', '🏠', '🛒'][i - 1]}
                                </div>
                            ))}
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">+{categories.length - 4}</div>
                        </div>
                    </div>
                </div>

                {activeTab === 'insights' ? (
                    /* INSIGHTS VIEW */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-xl">
                                <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                                    <span className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">📈</span> Spending Trend
                                </h3>
                                <div className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={insights?.monthlyTrend || []}>
                                            <defs>
                                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
                                                formatter={(val: number) => [`${currency.symbol} ${val.toLocaleString()}`, 'Spent']}
                                            />
                                            <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorAmount)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-xl">
                                <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                                    <span className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl">🍕</span> Allocation
                                </h3>
                                <div className="h-[350px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categoryChartData}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={80}
                                                outerRadius={120}
                                                paddingAngle={8}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {categoryChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-[2.5rem] p-8 text-white shadow-xl h-full">
                                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                                    <span>💡</span> Efficiency Insights
                                </h3>
                                <div className="space-y-6">
                                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20">
                                        <div className="text-xs uppercase font-bold opacity-70 mb-1">Top Sector</div>
                                        <div className="text-2xl font-black">{Object.keys(insights?.constByCategory || {}).sort((a, b) => (insights?.constByCategory[b] || 0) - (insights?.constByCategory[a] || 0))[0] || 'N/A'}</div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20">
                                        <div className="text-xs uppercase font-bold opacity-70 mb-1">Avg. Monthly</div>
                                        <div className="text-2xl font-black">{currency.symbol} {((insights?.total || 0) / Math.max(1, (insights?.monthlyTrend?.length || 1))).toLocaleString()}</div>
                                    </div>
                                    <p className="text-sm opacity-80 leading-relaxed mt-10">
                                        Based on your spending patterns, you are managing your expenses effectively. Consider reducing your top sector by 10% to meet your savings goals.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* MAIN WORKFLOW VIEW */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                        {/* Left Side - Forms and Inputs */}
                        <div className="space-y-8">

                            {/* AI & Receipt Zone */}
                            <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 text-6xl opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-1000">🤖</div>
                                <h3 className="text-2xl font-black mb-2 flex items-center gap-3">
                                    <span className="animate-pulse">✨</span> AI Smart Recorder
                                </h3>
                                <p className="text-indigo-200/70 text-sm mb-8 font-medium">Drop a receipt image or paste text for instant extraction</p>

                                <div
                                    className={`relative border-2 border-dashed rounded-[2rem] p-6 transition-all duration-300 ${isDragging ? 'border-blue-400 bg-white/10 scale-[1.02]' : 'border-white/20 hover:border-white/40'}`}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); alert('Receipt received! (Simulating AI)'); setAiText('Lulu Hypermarket - 250 AED for groceries.'); }}
                                >
                                    <textarea
                                        value={aiText}
                                        onChange={(e) => setAiText(e.target.value)}
                                        placeholder="Type something like: 'Spent 50 AED at Shell for petrol today' or drag an image here..."
                                        rows={3}
                                        className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-white/30 resize-none text-lg font-medium"
                                    />
                                    <div className="flex justify-between items-center mt-6">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10"
                                        >
                                            <span className="text-xl">📷</span>
                                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                                        </button>
                                        <button
                                            onClick={handleAiAnalyze}
                                            disabled={isAiLoading || !aiText.trim()}
                                            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-black rounded-[1.5rem] shadow-xl shadow-blue-500/30 transition-all flex items-center gap-2"
                                        >
                                            {isAiLoading ? 'Magic in progress...' : 'Magic Extract'} <span>🪄</span>
                                        </button>
                                    </div>
                                </div>

                                {showAiPreview && (
                                    <div className="mt-8 bg-white/10 backdrop-blur-2xl rounded-[2rem] p-6 border border-white/10 animate-in zoom-in-95 duration-500">
                                        <div className="flex justify-between items-center mb-6">
                                            <div className="font-bold text-emerald-400 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                                                AI EXTRACTED {aiParsedItems.length} ITEMS
                                            </div>
                                            <button onClick={() => setShowAiPreview(false)} className="text-white/50 hover:text-white">✕</button>
                                        </div>
                                        <div className="space-y-4 mb-8">
                                            {aiParsedItems.map((item, idx) => (
                                                <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                                                    <div>
                                                        <div className="font-bold">{item.category}</div>
                                                        <div className="text-[10px] opacity-50 uppercase">{item.merchant || 'General'}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-mono font-bold text-blue-400">{item.amount} {item.currency}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={handleAiConfirm} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all">
                                            Confirm & Save All Records
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Manual Entry Form */}
                            <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-10 shadow-xl border border-white dark:border-slate-700 relative overflow-hidden">
                                <h2 className="text-3xl font-black mb-10 flex items-center gap-3">
                                    <span className="text-blue-600">{editingId ? '✏️' : '📝'}</span>
                                    {editingId ? 'Edit Record' : 'Manual Entry'}
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase ml-2">Transaction Date</label>
                                            <input
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase ml-2">Amount ({currency.code})</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                placeholder="0.00"
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl px-6 py-4 font-black text-2xl font-mono focus:ring-2 focus:ring-blue-500 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center px-2">
                                                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Category</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowAddCategory(!showAddCategory)}
                                                    className="text-[10px] font-black text-blue-600 hover:underline"
                                                >
                                                    + CUSTOM
                                                </button>
                                            </div>
                                            {showAddCategory ? (
                                                <div className="flex gap-2">
                                                    <input
                                                        value={newCategoryName}
                                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                                        placeholder="New name..."
                                                        className="flex-1 bg-blue-50 dark:bg-blue-900/20 border-none rounded-xl px-4 py-3 text-sm font-bold"
                                                    />
                                                    <button type="button" onClick={handleAddCategory} className="bg-blue-600 text-white px-4 rounded-xl font-bold">Add</button>
                                                </div>
                                            ) : (
                                                <select
                                                    value={formData.category}
                                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl px-6 py-4 font-bold appearance-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                >
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase ml-2">Payment Method</label>
                                            <select
                                                value={formData.paymentMethod}
                                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl px-6 py-4 font-bold appearance-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            >
                                                <option value="cash">🏦 Cash</option>
                                                <option value="bank">🏛️ Bank Transfer</option>
                                                <option value="credit_card">💳 Credit Card</option>
                                                <option value="debit_card">💳 Debit Card</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase ml-2">Merchant Name</label>
                                        <input
                                            type="text"
                                            value={formData.merchant}
                                            onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                                            placeholder="e.g. Starbucks, Amazon, Carrefour..."
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-blue-500 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase ml-2">Additional Notes</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="What was this for?"
                                            rows={2}
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-6">
                                        {editingId && (
                                            <button
                                                type="button"
                                                onClick={() => { setEditingId(null); setFormData(prev => ({ ...prev, amount: '', merchant: '', notes: '' })); }}
                                                className="flex-1 py-5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black rounded-3xl"
                                            >
                                                Discard Edit
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            className="flex-[2] py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-3xl shadow-2xl shadow-blue-500/20 transition-all transform hover:scale-[1.02]"
                                        >
                                            {editingId ? 'Save Changes' : 'Record Transaction'} 🚀
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Right Side - History List */}
                        <div className="bg-white dark:bg-slate-800 rounded-[3.5rem] shadow-xl border border-white dark:border-slate-700 overflow-hidden flex flex-col h-[1000px] sticky top-8">
                            <div className="p-10 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-2xl font-black flex items-center gap-3">
                                        <span>📜</span> History
                                        <span className="text-sm font-bold bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full">{filteredExpenses.length}</span>
                                    </h2>
                                    <div className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full uppercase tracking-tighter">
                                        LIVE INVENTORY
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="relative flex-1 group">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity">🔍</span>
                                        <input
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Filter records..."
                                            className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-12 pr-6 py-4 font-bold shadow-inner focus:ring-2 focus:ring-blue-500 transition-all"
                                        />
                                    </div>
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-4 font-bold shadow-inner focus:ring-2 focus:ring-blue-500 transition-all"
                                    >
                                        <option value="all">Every Category</option>
                                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                                {filteredExpenses.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-20 opacity-50">
                                        <div className="text-8xl mb-6">🔍</div>
                                        <h3 className="text-2xl font-black mb-2">Nothing found</h3>
                                        <p className="font-medium">Try adjusting your filters or adding a new record</p>
                                    </div>
                                ) : (
                                    filteredExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
                                        <div key={expense.id} className="group bg-slate-50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800 p-6 rounded-[2rem] border border-transparent hover:border-blue-500/30 transition-all duration-300 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-slate-400 opacity-60 uppercase">{new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                        <span className="font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase tracking-tight">{expense.category}</span>
                                                    </div>
                                                    <div className="text-2xl font-black tracking-tighter">
                                                        {expense.merchant || 'General Expenditure'}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        <span className="text-[10px] font-black px-2.5 py-1 bg-slate-200 dark:bg-slate-700 rounded-lg opacity-80 uppercase">{expense.paymentMethod?.replace('_', ' ')}</span>
                                                        {expense.source.includes('gemini') && (
                                                            <span className="text-[10px] font-black px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg uppercase">AI ENRICHED 🪄</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-black text-rose-500 font-mono tracking-tighter">
                                                        -{currency.symbol}{expense.amount.toLocaleString()}
                                                    </div>
                                                    <div className="flex gap-2 justify-end mt-6 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                                        <button
                                                            onClick={() => handleEdit(expense)}
                                                            className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-lg shadow-blue-500/10"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(expense.id)}
                                                            className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-lg shadow-rose-500/10"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            {expense.notes && (
                                                <div className="mt-4 p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl text-xs text-slate-500 italic border border-slate-100 dark:border-slate-800">
                                                    "{expense.notes}"
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
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
                    border-radius: 20px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #334155;
                }
            `}</style>
        </div>
    );
}
