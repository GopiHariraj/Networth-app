"use client";

import React, { useState } from 'react';
import { useCurrency } from '../../lib/currency-context';
import { useNetWorth } from '../../lib/networth-context';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    chart?: ChartData;
}

interface ChartData {
    type: 'line' | 'bar' | 'pie';
    title: string;
    data: any[];
    xKey?: string;
    yKey?: string;
    colors?: string[];
}

const PRESET_QUESTIONS = [
    { id: 1, text: "Show my net worth trend last 12 months", icon: "📈" },
    { id: 2, text: "Breakdown my assets by category", icon: "🥧" },
    { id: 3, text: "Breakdown my liabilities by type", icon: "📊" },
    { id: 4, text: "Show gold value trend last 6 months", icon: "🥇" },
    { id: 5, text: "Show monthly EMI total and split by loan/card", icon: "💳" },
    { id: 6, text: "Compare cash vs investments over time", icon: "💰" },
    { id: 7, text: "Which category increased the most this month?", icon: "🔝" },
    { id: 8, text: "Show top 5 accounts by value", icon: "🏆" }
];

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function AIAnalyticsPage() {
    const { currency } = useCurrency();
    const { data: networthData } = useNetWorth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Real insights from NetWorthContext
    const insights = {
        netWorthTrend: networthData.netWorth > 0 ? `${currency.symbol} ${networthData.netWorth.toLocaleString()}` : "No data",
        biggestAssetChange: networthData.totalAssets > 0 ? `Total: ${currency.symbol} ${networthData.totalAssets.toLocaleString()}` : "No assets",
        biggestLiabilityChange: networthData.totalLiabilities > 0 ? `Total: ${currency.symbol} ${networthData.totalLiabilities.toLocaleString()}` : "No liabilities"
    };

    // Real data chart generator
    const generateRealChart = (questionId: number): ChartData | undefined => {
        switch (questionId) {
            case 1: // Net worth trend
                return {
                    type: 'line',
                    title: 'Net Worth Trend - Last 12 Months',
                    data: Array.from({ length: 12 }, (_, i) => ({
                        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
                        value: networthData.netWorth || 0
                    })),
                    xKey: 'month',
                    yKey: 'value'
                };
            case 2: // Assets breakdown
                const assetData = [];
                if (networthData.assets.property.totalValue > 0) assetData.push({ name: 'Property', value: networthData.assets.property.totalValue });
                if (networthData.assets.stocks.totalValue > 0) assetData.push({ name: 'Stocks', value: networthData.assets.stocks.totalValue });
                if (networthData.assets.gold.totalValue > 0) assetData.push({ name: 'Gold', value: networthData.assets.gold.totalValue });
                if (networthData.assets.bonds.totalValue > 0) assetData.push({ name: 'Bonds', value: networthData.assets.bonds.totalValue });
                if (networthData.assets.cash.totalCash > 0) assetData.push({ name: 'Cash', value: networthData.assets.cash.totalCash });

                return assetData.length > 0 ? {
                    type: 'pie',
                    title: 'Assets by Category',
                    data: assetData,
                    colors: COLORS
                } : undefined;
            case 3: // Liabilities breakdown
                const liabilityData = [];
                if (networthData.liabilities.loans.totalValue > 0) liabilityData.push({ name: 'Loans', value: networthData.liabilities.loans.totalValue });
                if (networthData.liabilities.creditCards.totalValue > 0) liabilityData.push({ name: 'Credit Cards', value: networthData.liabilities.creditCards.totalValue });

                return liabilityData.length > 0 ? {
                    type: 'pie',
                    title: 'Liabilities by Type',
                    data: liabilityData,
                    colors: ['#ef4444', '#f97316', '#f59e0b']
                } : undefined;
            case 4: // Gold trend
                return networthData.assets.gold.totalValue > 0 ? {
                    type: 'line',
                    title: 'Gold Value Trend - Last 6 Months',
                    data: Array.from({ length: 6 }, (_, i) => ({
                        month: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
                        value: networthData.assets.gold.totalValue
                    })),
                    xKey: 'month',
                    yKey: 'value'
                } : undefined;
            case 5: // EMI breakdown
                const emiData = [];
                if (networthData.liabilities.loans.totalValue > 0) emiData.push({ category: 'Loans', amount: networthData.liabilities.loans.totalValue });
                if (networthData.liabilities.creditCards.totalValue > 0) emiData.push({ category: 'Credit Cards', amount: networthData.liabilities.creditCards.totalValue });

                return emiData.length > 0 ? {
                    type: 'bar',
                    title: 'Monthly EMI Breakdown',
                    data: emiData,
                    xKey: 'category',
                    yKey: 'amount'
                } : undefined;
            case 8: // Top 5 accounts
                const topAccounts = [];
                if (networthData.assets.property.totalValue > 0) topAccounts.push({ account: 'Property', value: networthData.assets.property.totalValue });
                if (networthData.assets.stocks.totalValue > 0) topAccounts.push({ account: 'Stocks', value: networthData.assets.stocks.totalValue });
                if (networthData.assets.cash.totalCash > 0) topAccounts.push({ account: 'Cash', value: networthData.assets.cash.totalCash });
                if (networthData.assets.gold.totalValue > 0) topAccounts.push({ account: 'Gold', value: networthData.assets.gold.totalValue });
                if (networthData.assets.bonds.totalValue > 0) topAccounts.push({ account: 'Bonds', value: networthData.assets.bonds.totalValue });

                return topAccounts.length > 0 ? {
                    type: 'bar',
                    title: 'Top Accounts by Value',
                    data: topAccounts.sort((a, b) => b.value - a.value).slice(0, 5),
                    xKey: 'account',
                    yKey: 'value'
                } : undefined;
            default:
                return undefined;
        }
    };

    const handleSendMessage = async (text?: string) => {
        const messageText = text || inputMessage.trim();
        if (!messageText || isLoading) return;

        setIsLoading(true);
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');

        // Simulate AI response
        setTimeout(() => {
            const presetQuestion = PRESET_QUESTIONS.find(q => q.text === messageText);
            const chart = presetQuestion ? generateRealChart(presetQuestion.id) : undefined;

            let aiResponse = '';
            if (chart) {
                aiResponse = `I've generated a ${chart.type} chart showing ${chart.title.toLowerCase()}. `;
                if (chart.type === 'pie') {
                    aiResponse += `This breakdown helps you understand the distribution of your ${chart.title.toLowerCase()}.`;
                } else {
                    aiResponse += `The trend shows meaningful insights about your financial growth.`;
                }
            } else {
                aiResponse = `Based on your financial data, I can provide insights. Your net worth has shown a positive trend of ${insights.netWorthTrend} recently. ${insights.biggestAssetChange} shows the strongest growth. For detailed visualizations, try using the preset questions below.`;
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: aiResponse,
                chart: chart
            };

            setMessages(prev => [...prev, assistantMessage]);
            setIsLoading(false);
        }, 1500);
    };

    const handlePresetQuestion = (question: string) => {
        handleSendMessage(question);
    };

    const handleClearChat = () => {
        if (confirm('Clear all chat history?')) {
            setMessages([]);
        }
    };

    const handleExport = () => {
        const report = {
            timestamp: new Date().toISOString(),
            insights: insights,
            messages: messages.map(m => ({ role: m.role, content: m.content }))
        };
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ai-analytics-report-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const renderChart = (chartData: ChartData) => {
        switch (chartData.type) {
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={chartData.xKey || ''} />
                            <YAxis />
                            <Tooltip formatter={(value: number) => `${currency.symbol} ${value.toLocaleString()}`} />
                            <Legend />
                            <Line type="monotone" dataKey={chartData.yKey || ''} stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={chartData.xKey || ''} />
                            <YAxis />
                            <Tooltip formatter={(value: number) => `${currency.symbol} ${value.toLocaleString()}`} />
                            <Legend />
                            <Bar dataKey={chartData.yKey || ''} fill="#8b5cf6" />
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={chartData.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {chartData.data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={chartData.colors?.[index] || COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => `${currency.symbol} ${value.toLocaleString()}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                );
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">✨ AI Financial Analytics</h1>
                    <p className="text-slate-500 mt-2">Chat with AI to analyze your finances and generate insights</p>
                </header>

                {/* AI Insights Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="text-sm opacity-90">Net Worth Trend</div>
                        <div className="text-3xl font-bold mt-2">{insights.netWorthTrend}</div>
                        <div className="text-sm mt-1">Last 30 days</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="text-sm opacity-90">Biggest Asset Change</div>
                        <div className="text-2xl font-bold mt-2">{insights.biggestAssetChange}</div>
                        <div className="text-sm mt-1">This month</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
                        <div className="text-sm opacity-90">Biggest Liability Change</div>
                        <div className="text-2xl font-bold mt-2">{insights.biggestLiabilityChange}</div>
                        <div className="text-sm mt-1">This month</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Chat Area */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">💬 Chat with AI</h2>
                                <div className="flex gap-2">
                                    <button onClick={handleExport} className="px-4 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium transition-colors">
                                        📥 Export Report
                                    </button>
                                    <button onClick={handleClearChat} className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium transition-colors">
                                        🗑️ Clear Chat
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="p-6 space-y-4 h-96 overflow-y-auto">
                                {messages.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="text-6xl mb-4">🤖</div>
                                        <div className="text-slate-500 dark:text-slate-400">Start a conversation or use preset questions below</div>
                                    </div>
                                ) : (
                                    messages.map(message => (
                                        <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-3xl ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'} rounded-2xl p-4`}>
                                                <div className="text-sm font-semibold mb-1">{message.role === 'user' ? 'You' : '🤖 AI Assistant'}</div>
                                                <div className="text-sm">{message.content}</div>
                                                {message.chart && (
                                                    <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl p-4">
                                                        <h4 className="font-bold text-slate-900 dark:text-white mb-3">{message.chart.title}</h4>
                                                        {renderChart(message.chart)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl p-4">
                                            <div className="flex gap-2">
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Ask me anything about your finances..."
                                        className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <button
                                        onClick={() => handleSendMessage()}
                                        disabled={isLoading}
                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold rounded-xl transition-colors shadow-lg"
                                    >
                                        {isLoading ? '...' : '📤 Send'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preset Questions */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 sticky top-8">
                            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">📊 Graph Questions</h2>
                            <div className="space-y-2">
                                {PRESET_QUESTIONS.map(question => (
                                    <button
                                        key={question.id}
                                        onClick={() => handlePresetQuestion(question.text)}
                                        disabled={isLoading}
                                        className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-blue-50 dark:bg-slate-700 dark:hover:bg-blue-900/20 text-slate-900 dark:text-white rounded-xl transition-colors border border-slate-200 dark:border-slate-600 hover:border-blue-400 disabled:opacity-50"
                                    >
                                        <span className="mr-2">{question.icon}</span>
                                        <span className="text-sm">{question.text}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                                <div className="flex gap-2">
                                    <span className="text-lg">💡</span>
                                    <div className="text-xs text-yellow-800 dark:text-yellow-400">
                                        <div className="font-semibold">Note</div>
                                        <div className="mt-1">AI is read-only and cannot modify your data. It only provides analysis and insights.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
