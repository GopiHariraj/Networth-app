"use client";

import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../lib/currency-context';
import { useNetWorth } from '../../lib/networth-context';
import ImageLightbox from '../../components/ImageLightbox';
import { financialDataApi } from '../../lib/api/financial-data';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface GoldOrnament {
    id: string;
    ornamentName: string;
    grams: number;
    pricePerGram: number;
    totalValue: number;
    purchaseDate: string;
    purity: string;
    imageUrl?: string;
}

const PURITY_COLORS: { [key: string]: string } = {
    '24K': '#fbbf24',
    '22K': '#f59e0b',
    '18K': '#d97706',
    '14K': '#b45309',
    '10K': '#92400e',
};

const COLORS = ['#F59E0B', '#D97706', '#B45309', '#92400E', '#78350F', '#FBBF24'];

export default function GoldPage() {
    const { currency } = useCurrency();
    const { data, refreshNetWorth } = useNetWorth();
    const [ornaments, setOrnaments] = useState<GoldOrnament[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'Inventory' | 'Add Item' | 'Insights'>('Inventory');
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        ornamentName: '',
        grams: '',
        pricePerGram: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purity: '24K',
        imageUrl: ''
    });

    useEffect(() => {
        if (data.assets.gold.items) {
            setOrnaments(data.assets.gold.items.map((item: any) => ({
                id: item.id,
                ornamentName: item.ornamentName,
                grams: item.grams,
                pricePerGram: item.pricePerGram,
                totalValue: item.totalValue,
                purchaseDate: item.purchaseDate,
                purity: item.purity,
                imageUrl: item.imageUrl
            })));
        }
    }, [data.assets.gold.items]);

    const purityOptions = ['24K', '22K', '18K', '14K', '10K'];

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const calculateTotalValue = () => {
        const grams = parseFloat(formData.grams) || 0;
        const price = parseFloat(formData.pricePerGram) || 0;
        return grams * price;
    };

    const handleEdit = (ornament: GoldOrnament) => {
        setEditingId(ornament.id);
        setFormData({
            ornamentName: ornament.ornamentName,
            grams: ornament.grams.toString(),
            pricePerGram: ornament.pricePerGram.toString(),
            purchaseDate: ornament.purchaseDate,
            purity: ornament.purity,
            imageUrl: ornament.imageUrl || ''
        });
        setActiveTab('Add Item');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddOrnament = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.ornamentName || !formData.grams || !formData.pricePerGram) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const totalVal = calculateTotalValue();
            const goldData = {
                name: formData.ornamentName,
                weightGrams: parseFloat(formData.grams),
                purchasePrice: totalVal,
                purchaseDate: new Date(formData.purchaseDate).toISOString(),
                currentValue: totalVal,
                notes: `Purity: ${formData.purity}${formData.imageUrl ? `\nImage: ${formData.imageUrl}` : ''}`
            };

            if (editingId) {
                await financialDataApi.goldAssets.update(editingId, goldData);
                setEditingId(null);
            } else {
                await financialDataApi.goldAssets.create(goldData);
            }

            await refreshNetWorth();
            handleCancelEdit();
            setActiveTab('Inventory');
            alert('Saved successfully!');
        } catch (error) {
            alert('Failed to save. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({
            ornamentName: '',
            grams: '',
            pricePerGram: '',
            purchaseDate: new Date().toISOString().split('T')[0],
            purity: '24K',
            imageUrl: ''
        });
    };

    const handleDeleteOrnament = async (id: string) => {
        if (confirm('Are you sure you want to delete this ornament?')) {
            try {
                await financialDataApi.goldAssets.delete(id);
                await refreshNetWorth();
            } catch (error) {
                alert('Failed to delete. Please try again.');
            }
        }
    };

    const handleImageDownload = async (imageUrl: string) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `gold-photo-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getTotalGrams = () => ornaments.reduce((sum, ornament) => sum + ornament.grams, 0);
    const getTotalValueList = () => ornaments.reduce((sum, ornament) => sum + ornament.totalValue, 0);

    // Chart Data
    const purityDistribution = ornaments.reduce((acc: any, ornament) => {
        const existing = acc.find((item: any) => item.name === ornament.purity);
        if (existing) {
            existing.value += ornament.totalValue;
        } else {
            acc.push({ name: ornament.purity, value: ornament.totalValue });
        }
        return acc;
    }, []);

    const topOrnaments = [...ornaments]
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 5)
        .map(o => ({
            name: o.ornamentName?.length > 15 ? o.ornamentName.substring(0, 15) + '...' : (o.ornamentName || 'Unnamed Ornament'),
            value: o.totalValue
        }));

    const renderInsights = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Purity Distribution */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center text-amber-600">🥧</span>
                        Value by Purity
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={purityDistribution}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                >
                                    {purityDistribution.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={PURITY_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => [`${currency.symbol} ${value.toLocaleString()}`, 'Value']}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Ornaments */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center text-yellow-600">🏆</span>
                        Top 5 Ornaments
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topOrnaments} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    formatter={(value: number) => [`${currency.symbol} ${value.toLocaleString()}`, 'Value']}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" fill="#fbbf24" radius={[0, 8, 8, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 dark:from-amber-500/5 dark:to-yellow-500/5 rounded-3xl p-8 border border-amber-200/50 dark:border-amber-800/50">
                <h4 className="text-lg font-bold text-amber-800 dark:text-amber-400 mb-4 flex items-center gap-2">
                    <span className="text-2xl">💡</span> Quick Insight
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Average Price per Gram</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {currency.symbol} {(ornaments.length > 0 ? getTotalValueList() / getTotalGrams() : 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Largest Asset</div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {ornaments.length > 0 ? ornaments.sort((a, b) => b.totalValue - a.totalValue)[0].ornamentName : 'N/A'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10 flex flex-wrap justify-between items-end gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">🥇 Gold Inventory</h1>
                        <p className="text-slate-500 mt-2 text-lg">Manage and track your precious metal assets</p>
                    </div>

                    <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        {(['Inventory', 'Add Item', 'Insights'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === tab
                                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
                            >
                                {tab === 'Add Item' ? (editingId ? '✏️ Edit Item' : '➕ Add Item') : tab === 'Inventory' ? '📋 Inventory' : '📊 Insights'}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-3xl p-7 text-white shadow-xl shadow-amber-500/20">
                        <div className="text-amber-100 text-sm font-bold uppercase tracking-wider mb-2">Total Gold Weight</div>
                        <div className="text-4xl font-black">{getTotalGrams().toLocaleString()} <span className="text-xl font-medium">grams</span></div>
                    </div>
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-7 text-white shadow-xl shadow-slate-900/20">
                        <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Portfolio Value</div>
                        <div className="text-4xl font-black">{currency.symbol} {getTotalValueList().toLocaleString()}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-7 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Total Items</div>
                        <div className="text-4xl font-black text-slate-900 dark:text-white">{ornaments.length} <span className="text-xl font-medium text-slate-400">Assets</span></div>
                    </div>
                </div>

                <div className="min-h-[400px]">
                    {activeTab === 'Inventory' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                {ornaments.length === 0 ? (
                                    <div className="p-20 text-center">
                                        <div className="text-7xl mb-6">🥇</div>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Your inventory is empty</h3>
                                        <p className="text-slate-500 mb-8 max-w-sm mx-auto">Start building your gold portfolio by adding your first ornament or investment.</p>
                                        <button onClick={() => setActiveTab('Add Item')} className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-amber-500/20">
                                            Add First Item
                                        </button>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Item</th>
                                                    <th className="px-8 py-5 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Purity</th>
                                                    <th className="px-8 py-5 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Weight</th>
                                                    <th className="px-8 py-5 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Total Value</th>
                                                    <th className="px-8 py-5 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                {ornaments.map((ornament) => (
                                                    <tr key={ornament.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors group">
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-4">
                                                                <div className="relative">
                                                                    {ornament.imageUrl ? (
                                                                        <img
                                                                            src={ornament.imageUrl}
                                                                            alt={ornament.ornamentName}
                                                                            className="w-14 h-14 object-cover rounded-2xl border-2 border-slate-100 dark:border-slate-700 cursor-pointer hover:scale-105 transition-transform"
                                                                            onClick={() => { setLightboxImages([ornament.imageUrl!]); setLightboxOpen(true); }}
                                                                        />
                                                                    ) : (
                                                                        <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-2xl border-2 border-amber-100 dark:border-amber-900/30">
                                                                            🏆
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-slate-900 dark:text-white text-lg">{ornament.ornamentName}</div>
                                                                    <div className="text-xs text-slate-400 mt-0.5">Purchased: {new Date(ornament.purchaseDate).toLocaleDateString()}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-center">
                                                            <span className="px-4 py-1.5 rounded-full text-xs font-black tracking-widest" style={{ backgroundColor: `${PURITY_COLORS[ornament.purity]}20`, color: PURITY_COLORS[ornament.purity] }}>
                                                                {ornament.purity}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-5 text-right">
                                                            <div className="font-bold text-slate-900 dark:text-white">{ornament.grams} <span className="text-xs text-slate-400 font-medium">g</span></div>
                                                            <div className="text-[10px] text-slate-400">{currency.symbol} {ornament.pricePerGram.toLocaleString()}/g</div>
                                                        </td>
                                                        <td className="px-8 py-5 text-right">
                                                            <div className="text-lg font-black text-amber-600 dark:text-amber-500">{currency.symbol} {ornament.totalValue.toLocaleString()}</div>
                                                        </td>
                                                        <td className="px-8 py-5 text-center">
                                                            <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => handleEdit(ornament)} className="p-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl transition-colors">
                                                                    ✏️
                                                                </button>
                                                                <button onClick={() => handleDeleteOrnament(ornament.id)} className="p-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl transition-colors">
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Add Item' && (
                        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
                                <h2 className="text-2xl font-bold mb-8 text-slate-900 dark:text-white flex items-center gap-3">
                                    <span className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-xl">
                                        {editingId ? '✏️' : '➕'}
                                    </span>
                                    {editingId ? 'Edit Gold Item' : 'Add New Gold Asset'}
                                </h2>
                                <form onSubmit={handleAddOrnament} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Ornament Name *</label>
                                            <input
                                                type="text"
                                                value={formData.ornamentName}
                                                onChange={(e) => handleInputChange('ornamentName', e.target.value)}
                                                placeholder="e.g., Heavy Designer Necklace"
                                                required
                                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Purity/Karat</label>
                                            <select
                                                value={formData.purity}
                                                onChange={(e) => handleInputChange('purity', e.target.value)}
                                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all cursor-pointer"
                                            >
                                                {purityOptions.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Weight (Grams) *</label>
                                            <input
                                                type="number"
                                                step="0.001"
                                                value={formData.grams}
                                                onChange={(e) => handleInputChange('grams', e.target.value)}
                                                placeholder="e.g., 25.5"
                                                required
                                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Price per Gram ({currency.code}) *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.pricePerGram}
                                                onChange={(e) => handleInputChange('pricePerGram', e.target.value)}
                                                placeholder="e.g., 250"
                                                required
                                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Purchase Date</label>
                                            <input
                                                type="date"
                                                value={formData.purchaseDate}
                                                onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Item Photograph (Optional)</label>
                                        <div className="flex items-center gap-6">
                                            <div className="flex-1">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 cursor-pointer"
                                                />
                                            </div>
                                            {formData.imageUrl && (
                                                <img src={formData.imageUrl} alt="Preview" className="w-20 h-20 object-cover rounded-2xl border-2 border-amber-200" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-4">
                                        {editingId && (
                                            <button type="button" onClick={handleCancelEdit} className="flex-1 px-8 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all">
                                                Cancel
                                            </button>
                                        )}
                                        <button type="submit" disabled={isSubmitting} className="flex-[2] px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:shadow-amber-500/20 hover:shadow-xl text-white font-black rounded-2xl transition-all disabled:opacity-50">
                                            {isSubmitting ? 'Processing...' : (editingId ? '💾 Update Item' : '🚀 Add to Inventory')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Insights' && renderInsights()}
                </div>
            </div>
            <ImageLightbox images={lightboxImages} currentIndex={0} isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} onDownload={handleImageDownload} />
        </div>
    );
}
