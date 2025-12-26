"use client";

import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../lib/currency-context';
import { useNetWorth } from '../../lib/networth-context';
import { financialDataApi } from '../../lib/api/financial-data';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface HousingLoan {
    id: string;
    lenderName: string;
    linkedProperty: string;
    originalAmount: number;
    outstandingBalance: number;
    interestRate: number;
    emiAmount: number;
    emiDueDate: number;
    loanStartDate: string;
    loanEndDate: string;
    notes: string;
}

interface CreditCard {
    id: string;
    cardName: string;
    bankName: string;
    totalLimit: number;
    usedAmount: number;
    minimumDue: number;
    dueDate: number;
    statementDate: number;
    monthlyInstallment: number;
    lastPaymentAmount: number;
    lastPaymentDate: string;
}

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981'];

export default function LoansPage() {
    const { currency } = useCurrency();
    const { data, refreshNetWorth } = useNetWorth();
    const [loans, setLoans] = useState<HousingLoan[]>([]);
    const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
    const [activeTab, setActiveTab] = useState<'loans' | 'cards' | 'insights'>('loans');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
    const [editingCardId, setEditingCardId] = useState<string | null>(null);

    const [loanForm, setLoanForm] = useState({
        lenderName: '',
        linkedProperty: '',
        originalAmount: '',
        outstandingBalance: '',
        interestRate: '',
        emiAmount: '',
        emiDueDate: '1',
        loanStartDate: '',
        loanEndDate: '',
        notes: ''
    });

    const [cardForm, setCardForm] = useState({
        cardName: '',
        bankName: '',
        totalLimit: '',
        usedAmount: '',
        minimumDue: '',
        dueDate: '1',
        statementDate: '1',
        monthlyInstallment: '',
        lastPaymentAmount: '',
        lastPaymentDate: ''
    });

    useEffect(() => {
        if (data.liabilities.loans.items) {
            setLoans(data.liabilities.loans.items.map((l: any) => ({
                id: l.id,
                lenderName: l.lenderName,
                linkedProperty: l.linkedProperty,
                originalAmount: parseFloat(l.originalAmount) || 0,
                outstandingBalance: parseFloat(l.outstandingBalance) || 0,
                interestRate: parseFloat(l.interestRate) || 0,
                emiAmount: parseFloat(l.emiAmount) || 0,
                emiDueDate: l.emiDueDate || 1,
                loanStartDate: (l.loanStartDate || new Date().toISOString()).split('T')[0],
                loanEndDate: (l.loanEndDate || new Date().toISOString()).split('T')[0],
                notes: l.notes
            })));
        }
        if (data.liabilities.creditCards.items) {
            setCreditCards(data.liabilities.creditCards.items.map((c: any) => ({
                id: c.id,
                cardName: c.cardName,
                bankName: c.bankName,
                totalLimit: parseFloat(c.creditLimit) || parseFloat(c.totalLimit) || 0,
                usedAmount: parseFloat(c.usedAmount) || 0,
                minimumDue: parseFloat(c.notes?.match(/MinDue: (.*)/)?.[1] || '0') || 0,
                dueDate: c.dueDate || 1,
                statementDate: 1,
                monthlyInstallment: parseFloat(c.notes?.match(/EMI: (.*)/)?.[1] || '0') || 0,
                lastPaymentAmount: 0,
                lastPaymentDate: ''
            })));
        }
    }, [data.liabilities.loans.items, data.liabilities.creditCards.items]);

    const handleEditLoan = (loan: HousingLoan) => {
        setEditingLoanId(loan.id);
        setLoanForm({
            lenderName: loan.lenderName,
            linkedProperty: loan.linkedProperty,
            originalAmount: loan.originalAmount.toString(),
            outstandingBalance: loan.outstandingBalance.toString(),
            interestRate: loan.interestRate.toString(),
            emiAmount: loan.emiAmount.toString(),
            emiDueDate: loan.emiDueDate.toString(),
            loanStartDate: loan.loanStartDate,
            loanEndDate: loan.loanEndDate,
            notes: loan.notes
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleEditCard = (card: CreditCard) => {
        setEditingCardId(card.id);
        setCardForm({
            cardName: card.cardName,
            bankName: card.bankName,
            totalLimit: card.totalLimit.toString(),
            usedAmount: card.usedAmount.toString(),
            minimumDue: card.minimumDue.toString(),
            dueDate: card.dueDate.toString(),
            statementDate: card.statementDate.toString(),
            monthlyInstallment: card.monthlyInstallment.toString(),
            lastPaymentAmount: card.lastPaymentAmount.toString(),
            lastPaymentDate: card.lastPaymentDate
        });
        setActiveTab('cards');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingLoanId(null);
        setEditingCardId(null);
        setLoanForm({ lenderName: '', linkedProperty: '', originalAmount: '', outstandingBalance: '', interestRate: '', emiAmount: '', emiDueDate: '1', loanStartDate: '', loanEndDate: '', notes: '' });
        setCardForm({ cardName: '', bankName: '', totalLimit: '', usedAmount: '', minimumDue: '', dueDate: '1', statementDate: '1', monthlyInstallment: '', lastPaymentAmount: '', lastPaymentDate: '' });
    };

    const handleAddLoan = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const loanData = {
                loanType: loanForm.linkedProperty || 'HOME',
                lenderName: loanForm.lenderName,
                principal: parseFloat(loanForm.originalAmount),
                interestRate: parseFloat(loanForm.interestRate),
                emiAmount: parseFloat(loanForm.emiAmount),
                outstanding: parseFloat(loanForm.outstandingBalance),
                startDate: new Date(loanForm.loanStartDate).toISOString(),
                endDate: new Date(loanForm.loanEndDate).toISOString(),
                notes: loanForm.notes
            };

            if (editingLoanId) {
                await financialDataApi.loans.update(editingLoanId, loanData);
                setEditingLoanId(null);
                alert('✅ Loan updated successfully!');
            } else {
                await financialDataApi.loans.create(loanData);
                alert('🚀 Loan added successfully!');
            }
            await refreshNetWorth();
            setLoanForm({ lenderName: '', linkedProperty: '', originalAmount: '', outstandingBalance: '', interestRate: '', emiAmount: '', emiDueDate: '1', loanStartDate: '', loanEndDate: '', notes: '' });
        } catch (error) {
            alert('Failed to save loan. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddCard = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const cardData = {
                cardName: cardForm.cardName,
                bankName: cardForm.bankName,
                creditLimit: parseFloat(cardForm.totalLimit),
                usedAmount: parseFloat(cardForm.usedAmount),
                dueDate: parseInt(cardForm.dueDate),
                notes: `MinDue: ${cardForm.minimumDue}\nEMI: ${cardForm.monthlyInstallment}`
            };

            if (editingCardId) {
                await financialDataApi.creditCards.update(editingCardId, cardData);
                setEditingCardId(null);
                alert('✅ Credit card updated successfully!');
            } else {
                await financialDataApi.creditCards.create(cardData);
                alert('🚀 Credit card added successfully!');
            }
            await refreshNetWorth();
            setCardForm({ cardName: '', bankName: '', totalLimit: '', usedAmount: '', minimumDue: '', dueDate: '1', statementDate: '1', monthlyInstallment: '', lastPaymentAmount: '', lastPaymentDate: '' });
        } catch (error) {
            alert('Failed to save card. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteLoan = async (id: string) => {
        if (confirm('Are you sure you want to delete this loan?')) {
            await financialDataApi.loans.delete(id);
            await refreshNetWorth();
        }
    };

    const handleDeleteCard = async (id: string) => {
        if (confirm('Are you sure you want to delete this credit card?')) {
            await financialDataApi.creditCards.delete(id);
            await refreshNetWorth();
        }
    };

    const getTotalLoanBalance = () => loans.reduce((sum, l) => sum + l.outstandingBalance, 0);
    const getTotalUsed = () => creditCards.reduce((sum, c) => sum + c.usedAmount, 0);
    const getTotalEMI = () => loans.reduce((sum, l) => sum + l.emiAmount, 0) + creditCards.reduce((sum, c) => sum + c.monthlyInstallment, 0);

    // Chart Data
    const debtDistribution = [
        { name: 'Loans', value: getTotalLoanBalance() },
        { name: 'Credit Cards', value: getTotalUsed() }
    ].filter(d => d.value > 0);

    const loanChartData = loans.map(l => ({
        name: l.lenderName.length > 12 ? l.lenderName.substring(0, 12) + '...' : l.lenderName,
        outstanding: l.outstandingBalance,
        rate: l.interestRate
    }));

    const cardChartData = creditCards.map(c => ({
        name: c.cardName,
        used: c.usedAmount,
        limit: c.totalLimit
    }));

    const renderInsights = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Liability Allocation</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={debtDistribution}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                >
                                    {debtDistribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => `${currency.symbol} ${value.toLocaleString()}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Loan Outstanding vs Interest Rate</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={loanChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis yAxisId="left" orientation="left" stroke="#ef4444" />
                                <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
                                <Tooltip />
                                <Bar yAxisId="left" dataKey="outstanding" fill="#ef4444" radius={[4, 4, 0, 0]} name="Outstanding" />
                                <Bar yAxisId="right" dataKey="rate" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Interest Rate (%)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-8 border border-red-200 dark:border-red-900/30">
                <h4 className="text-lg font-bold text-red-800 dark:text-red-400 mb-6 flex items-center gap-2">
                    <span>⚠️</span> Debt Health Check
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Debt to Cash Ratio</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">
                            {((getTotalLoanBalance() + getTotalUsed()) / (data.assets.cash.totalCash || 1) * 100).toFixed(1)}%
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Average Interest Rate</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">
                            {(loans.reduce((acc, l) => acc + l.interestRate, 0) / (loans.length || 1)).toFixed(2)}%
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Monthly Repayment</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{currency.symbol} {getTotalEMI().toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 mb-1">Total Loan Principal</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{currency.symbol} {loans.reduce((acc, l) => acc + l.originalAmount, 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 text-slate-900 dark:text-white">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10 flex flex-wrap justify-between items-end gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight">💳 Loans & Liabilities</h1>
                        <p className="text-slate-500 mt-2 text-lg">Track and manage your debts and credit obligations</p>
                    </div>
                    <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        {(['loans', 'cards', 'insights'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                                    }`}
                            >
                                {tab === 'loans' ? '🏠 Housing Loans' : tab === 'cards' ? '💳 Credit Cards' : '📊 Insights'}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="bg-gradient-to-br from-red-500 via-rose-600 to-pink-600 p-7 rounded-3xl text-white shadow-xl shadow-red-500/20">
                        <div className="text-red-100 text-sm font-bold uppercase tracking-wider mb-2">Total Outstanding Debt</div>
                        <div className="text-3xl md:text-4xl font-black">{currency.symbol} {(getTotalLoanBalance() + getTotalUsed()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="mt-2 text-xs text-red-100">Loans + Cards</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-7 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">🏠 Loans Outstanding</div>
                        <div className="text-3xl md:text-4xl font-black text-red-600 dark:text-red-500">{currency.symbol} {getTotalLoanBalance().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="mt-2 text-xs text-slate-400">{loans.length} active {loans.length === 1 ? 'loan' : 'loans'}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-7 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">💳 Cards Outstanding</div>
                        <div className="text-3xl md:text-4xl font-black text-orange-600">{currency.symbol} {getTotalUsed().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="mt-2 text-xs text-slate-400">{creditCards.length} active {creditCards.length === 1 ? 'card' : 'cards'}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-7 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Monthly EMI</div>
                        <div className="text-3xl md:text-4xl font-black">{currency.symbol} {getTotalEMI().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="mt-2 text-xs text-slate-400">Due every month</div>
                    </div>
                </div>

                <div className="min-h-[400px]">
                    {activeTab === 'loans' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="lg:col-span-1">
                                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 sticky top-8">
                                    <h3 className="font-bold text-xl mb-6">{editingLoanId ? '✏️ Edit Housing Loan' : '➕ Add Housing Loan'}</h3>
                                    <form onSubmit={handleAddLoan} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 mb-1">Lender Name</label>
                                            <input placeholder="e.g., ADCB Bank" value={loanForm.lenderName} onChange={e => setLoanForm({ ...loanForm, lenderName: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 outline-none transition-all" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-500 mb-1">Principal</label>
                                                <input type="number" placeholder="Original" value={loanForm.originalAmount} onChange={e => setLoanForm({ ...loanForm, originalAmount: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-500 mb-1">Outstanding</label>
                                                <input type="number" placeholder="Current" value={loanForm.outstandingBalance} onChange={e => setLoanForm({ ...loanForm, outstandingBalance: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 outline-none" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-500 mb-1">EMI ({currency.code})</label>
                                                <input type="number" placeholder="Monthly" value={loanForm.emiAmount} onChange={e => setLoanForm({ ...loanForm, emiAmount: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-500 mb-1">Rate (%)</label>
                                                <input type="number" step="0.01" placeholder="Yearly" value={loanForm.interestRate} onChange={e => setLoanForm({ ...loanForm, interestRate: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 outline-none" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-500 mb-1">Start Date</label>
                                                <input type="date" value={loanForm.loanStartDate} onChange={e => setLoanForm({ ...loanForm, loanStartDate: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-500 mb-1">End Date</label>
                                                <input type="date" value={loanForm.loanEndDate} onChange={e => setLoanForm({ ...loanForm, loanEndDate: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 outline-none" />
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            {editingLoanId && (
                                                <button
                                                    type="button"
                                                    onClick={handleCancelEdit}
                                                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-2xl font-black transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black shadow-lg shadow-red-600/20 transition-all"
                                            >
                                                {isSubmitting ? 'Saving...' : (editingLoanId ? '💾 Update Loan' : 'Add Loan Account')}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                            <div className="lg:col-span-2 space-y-4">
                                {loans.length === 0 ? (
                                    <div className="bg-white dark:bg-slate-800 p-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500">
                                        No active housing loans found.
                                    </div>
                                ) : (
                                    loans.map(l => (
                                        <div key={l.id} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 flex justify-between items-center group hover:shadow-lg transition-all">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-xl">🏠</div>
                                                    <div className="font-black text-2xl tracking-tight">{l.lenderName}</div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-8 mt-6">
                                                    <div>
                                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Interest Rate</p>
                                                        <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{l.interestRate}%</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Monthly EMI</p>
                                                        <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{currency.symbol} {l.emiAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Maturity</p>
                                                        <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{new Date(l.loanEndDate).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs text-slate-400 font-bold uppercase">Outstanding Balance</p>
                                                        <p className="text-3xl font-black text-red-600 dark:text-red-500 mt-1">{currency.symbol} {l.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                    </div>
                                                    <div className="w-48 bg-slate-100 dark:bg-slate-900 h-2.5 rounded-full overflow-hidden">
                                                        <div className="bg-red-500 h-full" style={{ width: `${(1 - l.outstandingBalance / l.originalAmount) * 100}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditLoan(l)}
                                                    className="p-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                                                    title="Edit Loan"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteLoan(l.id)}
                                                    className="p-4 bg-slate-100 hover:bg-red-50 dark:bg-slate-900 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                                                    title="Delete Loan"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'cards' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="lg:col-span-1">
                                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 sticky top-8">
                                    <h3 className="font-bold text-xl mb-6">{editingCardId ? '✏️ Edit Credit Card' : '➕ Add Credit Card'}</h3>
                                    <form onSubmit={handleAddCard} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 mb-1">Card Name</label>
                                            <input placeholder="e.g., Infinite Visa" value={cardForm.cardName} onChange={e => setCardForm({ ...cardForm, cardName: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-500 mb-1">Issuing Bank</label>
                                            <input placeholder="e.g., HSBC" value={cardForm.bankName} onChange={e => setCardForm({ ...cardForm, bankName: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500 outline-none" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-500 mb-1">Credit Limit</label>
                                                <input type="number" placeholder="Total" value={cardForm.totalLimit} onChange={e => setCardForm({ ...cardForm, totalLimit: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-500 mb-1">Used Amount</label>
                                                <input type="number" placeholder="Current" value={cardForm.usedAmount} onChange={e => setCardForm({ ...cardForm, usedAmount: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-500 mb-1">Due Day</label>
                                                <input type="number" min="1" max="31" placeholder="1-31" value={cardForm.dueDate} onChange={e => setCardForm({ ...cardForm, dueDate: e.target.value })} required className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-500 mb-1">Min Due ({currency.code})</label>
                                                <input type="number" placeholder="Optional" value={cardForm.minimumDue} onChange={e => setCardForm({ ...cardForm, minimumDue: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700" />
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            {editingCardId && (
                                                <button
                                                    type="button"
                                                    onClick={handleCancelEdit}
                                                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-2xl font-black transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black shadow-lg shadow-red-600/20"
                                            >
                                                {isSubmitting ? 'Saving...' : (editingCardId ? '💾 Update Card' : 'Add Credit Card')}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {creditCards.length === 0 ? (
                                    <div className="col-span-2 bg-white dark:bg-slate-800 p-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500">
                                        No credit cards added.
                                    </div>
                                ) : (
                                    creditCards.map(c => (
                                        <div key={c.id} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 group hover:shadow-lg transition-all">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <div className="font-black text-2xl tracking-tight leading-tight">{c.cardName}</div>
                                                    <div className="text-slate-400 font-bold uppercase text-xs mt-1 tracking-widest">{c.bankName}</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditCard(c)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                        title="Edit Card"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCard(c.id)}
                                                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                        title="Delete Card"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mt-8">
                                                <div className="flex justify-between items-end mb-2">
                                                    <span className="text-sm font-bold text-slate-400">CREDIT UTILIZATION</span>
                                                    <span className="text-xl font-black text-red-600">{((c.usedAmount / c.totalLimit) * 100).toFixed(0)}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-900 h-3 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${c.usedAmount / c.totalLimit > 0.8 ? 'bg-red-500' : 'bg-orange-500'}`}
                                                        style={{ width: `${(c.usedAmount / c.totalLimit) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between mt-4">
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase">Outstanding</p>
                                                        <p className="text-lg font-black">{currency.symbol} {c.usedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-slate-400 font-black uppercase">Available</p>
                                                        <p className="text-lg font-black text-emerald-500">{currency.symbol} {(c.totalLimit - c.usedAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-400">Due Date:</span>
                                                    <span className="font-black">Day {c.dueDate}</span>
                                                </div>
                                                {c.minimumDue > 0 && (
                                                    <div className="text-red-500 font-bold">
                                                        Min: {currency.symbol}{c.minimumDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'insights' && renderInsights()}
                </div>
            </div>
        </div>
    );
}
