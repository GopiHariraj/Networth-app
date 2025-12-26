"use client";

import React, { useState, useEffect } from 'react';
import { useCurrency } from '../../lib/currency-context';
import { useNetWorth } from '../../lib/networth-context';
import { financialDataApi } from '../../lib/api/financial-data';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Property {
    id: string;
    propertyName: string;
    propertyType: string;
    location: string;
    address: string;
    purchasePrice: number;
    currentValue: number;
    purchaseDate: string;
    area: number;
    imageUrl?: string;
}

export default function PropertyPage() {
    const { currency } = useCurrency();
    const { data, refreshNetWorth } = useNetWorth();
    const [properties, setProperties] = useState<Property[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('Portfolio');
    const [formData, setFormData] = useState({
        propertyName: '',
        propertyType: 'Apartment',
        location: '',
        address: '',
        purchasePrice: '',
        currentValue: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        area: '',
        imageUrl: ''
    });

    useEffect(() => {
        if (data.assets.property.items) {
            setProperties(data.assets.property.items.map((p: any) => ({
                id: p.id,
                propertyName: p.name,
                propertyType: p.propertyType,
                location: p.location,
                address: p.notes?.match(/Address: (.*)/)?.[1] || '',
                purchasePrice: parseFloat(p.purchasePrice),
                currentValue: parseFloat(p.currentValue),
                purchaseDate: p.purchaseDate ? p.purchaseDate.split('T')[0] : p.createdAt.split('T')[0],
                area: parseFloat(p.notes?.match(/Area: (.*)/)?.[1] || '0'),
                imageUrl: p.notes?.match(/Image: (.*)/)?.[1] || ''
            })));
        }
    }, [data.assets.property.items]);

    const propertyTypes = [
        'Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Studio', 'Land/Plot', 'Commercial', 'Office', 'Warehouse', 'Building'
    ];

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

    const handleEdit = (property: Property) => {
        setEditingId(property.id);
        setFormData({
            propertyName: property.propertyName,
            propertyType: property.propertyType,
            location: property.location,
            address: property.address,
            purchasePrice: property.purchasePrice.toString(),
            currentValue: property.currentValue.toString(),
            purchaseDate: property.purchaseDate,
            area: property.area.toString(),
            imageUrl: property.imageUrl || ''
        });
        setActiveTab('Add Property');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddProperty = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.propertyName || !formData.location || !formData.purchasePrice || !formData.currentValue) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const notes = `Address: ${formData.address || ''}\nArea: ${formData.area || '0'}${formData.imageUrl ? `\nImage: ${formData.imageUrl}` : ''}`;
            const propertyData = {
                name: formData.propertyName,
                propertyType: formData.propertyType,
                location: formData.location,
                purchasePrice: parseFloat(formData.purchasePrice),
                currentValue: parseFloat(formData.currentValue),
                purchaseDate: new Date(formData.purchaseDate).toISOString(),
                notes: notes
            };

            if (editingId) {
                await financialDataApi.properties.update(editingId, propertyData);
                setEditingId(null);
                alert('✅ Property updated successfully!');
            } else {
                await financialDataApi.properties.create(propertyData);
                alert('🚀 Property added successfully!');
            }
            await refreshNetWorth();

            setFormData({
                propertyName: '',
                propertyType: 'Apartment',
                location: '',
                address: '',
                purchasePrice: '',
                currentValue: '',
                purchaseDate: new Date().toISOString().split('T')[0],
                area: '',
                imageUrl: ''
            });
            setActiveTab('Portfolio');
        } catch (error) {
            alert('Failed to save property. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({
            propertyName: '',
            propertyType: 'Apartment',
            location: '',
            address: '',
            purchasePrice: '',
            currentValue: '',
            purchaseDate: new Date().toISOString().split('T')[0],
            area: '',
            imageUrl: ''
        });
        setActiveTab('Portfolio');
    };

    const handleDeleteProperty = async (id: string) => {
        if (confirm('Are you sure you want to delete this property?')) {
            try {
                await financialDataApi.properties.delete(id);
                await refreshNetWorth();
            } catch (error) {
                alert('Failed to delete property. Please try again.');
            }
        }
    };

    const getTotalValue = () => properties.reduce((sum, property) => sum + property.currentValue, 0);
    const getTotalInvestment = () => properties.reduce((sum, property) => sum + property.purchasePrice, 0);
    const getTotalGainLoss = () => getTotalValue() - getTotalInvestment();
    const getGainLossPercentage = () => {
        const investment = getTotalInvestment();
        return investment === 0 ? 0 : ((getTotalGainLoss() / investment) * 100);
    };

    const typeDistribution = properties.reduce((acc: any, p) => {
        const existing = acc.find((item: any) => item.name === p.propertyType);
        if (existing) existing.value += p.currentValue;
        else acc.push({ name: p.propertyType, value: p.currentValue });
        return acc;
    }, []);

    const COLORS = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-10 flex flex-wrap justify-between items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center">🏠</span>
                            Property Portfolio
                        </h1>
                        <p className="text-slate-500 mt-2">Manage your real estate investments and track property values</p>
                    </div>

                    <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        {['Portfolio', 'Add Property', 'Insights'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab
                                    ? 'bg-orange-500 text-white shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-8 text-white shadow-xl shadow-orange-200 dark:shadow-none">
                        <div className="text-sm opacity-90 font-medium tracking-wide uppercase">Portfolio Value</div>
                        <div className="text-4xl font-bold mt-3 font-mono">{currency.symbol} {getTotalValue().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="mt-4 text-xs font-bold bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm italic">
                            {properties.length} Active Properties
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500 font-medium tracking-wide uppercase">Investment</div>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white mt-3 font-mono">{currency.symbol} {getTotalInvestment().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500 font-medium tracking-wide uppercase">Appreciation</div>
                        <div className={`text-3xl font-bold mt-3 font-mono ${getTotalGainLoss() >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {getTotalGainLoss() >= 0 ? '+' : ''}{currency.symbol} {getTotalGainLoss().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className={`mt-2 text-xs font-bold ${getTotalGainLoss() >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {getGainLossPercentage().toFixed(2)}% ROI
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-sm text-slate-500 font-medium tracking-wide uppercase">Property Count</div>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white mt-3 font-mono">{properties.length}</div>
                        <div className="mt-2 text-xs text-slate-400">Managed Globally</div>
                    </div>
                </div>

                {activeTab === 'Portfolio' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {properties.length === 0 ? (
                            <div className="col-span-2 py-20 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
                                <div className="text-6xl mb-6">🏘️</div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No properties yet</h3>
                                <p className="text-slate-500 mb-8">Start tracking your real estate portfolio today.</p>
                                <button
                                    onClick={() => setActiveTab('Add Property')}
                                    className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-orange-500/20"
                                >
                                    Add Your First Property
                                </button>
                            </div>
                        ) : (
                            properties.map(p => (
                                <div key={p.id} className="group bg-white dark:bg-slate-800 rounded-3xl shadow-sm hover:shadow-2xl transition-all border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col sm:flex-row h-full">
                                    <div className="sm:w-2/5 relative">
                                        {p.imageUrl ? (
                                            <img src={p.imageUrl} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" alt={p.propertyName} />
                                        ) : (
                                            <div className="h-48 sm:h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-6xl">🏢</div>
                                        )}
                                        <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                            {p.propertyType}
                                        </div>
                                    </div>
                                    <div className="sm:w-3/5 p-8 flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors uppercase tracking-tight">{p.propertyName}</h3>
                                                <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                                                    <span>📍</span> {p.location}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(p)}
                                                    className="w-10 h-10 flex items-center justify-center bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-500 rounded-xl transition-all"
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProperty(p.id)}
                                                    className="w-10 h-10 flex items-center justify-center bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-500 rounded-xl transition-all"
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-auto">
                                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Current Value</div>
                                                <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">{currency.symbol}{p.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                            </div>
                                            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/20">
                                                <div className="text-[10px] text-emerald-600 font-bold uppercase mb-1">Appreciation</div>
                                                <div className="text-lg font-bold text-emerald-600 font-mono">
                                                    +{currency.symbol}{(p.currentValue - p.purchasePrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <span>Bought: {new Date(p.purchaseDate).toLocaleDateString()}</span>
                                            <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded italic">Cost: {currency.symbol}{p.purchasePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'Add Property' && (
                    <div className="max-w-3xl mx-auto animate-in fade-in zoom-in duration-300">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
                            <h2 className="text-2xl font-bold mb-8 text-slate-900 dark:text-white flex items-center gap-3">
                                <span className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-xl">
                                    {editingId ? '✏️' : '➕'}
                                </span>
                                {editingId ? 'Modify Asset Details' : 'Register New Asset'}
                            </h2>
                            <form onSubmit={handleAddProperty} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Display Name *</label>
                                        <input type="text" placeholder="e.g., Dubai Marina Residence" value={formData.propertyName} onChange={(e) => handleInputChange('propertyName', e.target.value)} required className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Property Category</label>
                                        <select value={formData.propertyType} onChange={(e) => handleInputChange('propertyType', e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all cursor-pointer">
                                            {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Location/City *</label>
                                        <input type="text" placeholder="e.g., Dubai, UAE" value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)} required className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Purchase Price ({currency.code}) *</label>
                                        <input type="number" value={formData.purchasePrice} onChange={(e) => handleInputChange('purchasePrice', e.target.value)} required className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all font-mono" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Estimated Current Value ({currency.code}) *</label>
                                        <input type="number" value={formData.currentValue} onChange={(e) => handleInputChange('currentValue', e.target.value)} required className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all font-mono" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Purchase Date</label>
                                        <input type="date" value={formData.purchaseDate} onChange={(e) => handleInputChange('purchaseDate', e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all cursor-pointer" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Total Area (sq ft)</label>
                                        <input type="number" placeholder="Optional" value={formData.area} onChange={(e) => handleInputChange('area', e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all font-mono" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Property Photo</label>
                                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-3xl p-10 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 transition-all cursor-pointer relative overflow-hidden">
                                        <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                        {formData.imageUrl ? (
                                            <div className="absolute inset-0">
                                                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                    <span className="text-white font-bold">Change Image</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <div className="text-4xl mb-2">📸</div>
                                                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Click to upload photo</div>
                                                <div className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6 border-t border-slate-100 dark:border-slate-700">
                                    <button type="button" onClick={handleCancelEdit} className="flex-1 px-8 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all">Discard Changes</button>
                                    <button type="submit" disabled={isSubmitting} className="flex-[2] px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50">
                                        {isSubmitting ? 'Saving...' : (editingId ? '💾 Update Asset' : '🚀 Confirm Registration')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'Insights' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                                <h3 className="text-xl font-bold mb-8 text-slate-900 dark:text-white flex items-center gap-3">
                                    <span className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">📊</span>
                                    Asset Allocation
                                </h3>
                                <div className="h-[350px]">
                                    {typeDistribution.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={typeDistribution}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={80}
                                                    outerRadius={120}
                                                    paddingAngle={5}
                                                >
                                                    {typeDistribution.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value: number) => [`${currency.symbol} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Current Value']}
                                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                                />
                                                <Legend iconType="circle" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-400 font-medium">No data to calculate distribution</div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-bold mb-6">Investment Overview</h3>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                            <span className="text-slate-400 uppercase text-xs font-bold tracking-widest">Growth Rate</span>
                                            <span className="text-3xl font-bold text-emerald-400 font-mono">+{getGainLossPercentage().toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                            <span className="text-slate-400 uppercase text-xs font-bold tracking-widest">Average Value</span>
                                            <span className="text-2xl font-bold font-mono">
                                                {currency.symbol}{(properties.length > 0 ? getTotalValue() / properties.length : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                            <span className="text-slate-400 uppercase text-xs font-bold tracking-widest">Max Appreciation</span>
                                            <span className="text-2xl font-bold text-orange-400 font-mono">
                                                {currency.symbol}{(properties.length > 0 ? Math.max(...properties.map(p => p.currentValue - p.purchasePrice)) : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-12 p-6 bg-white/5 rounded-2xl border border-white/10">
                                        <p className="text-slate-400 text-sm italic">"Real estate is an imperishable asset, ever increasing in value. It is the most solid security that human ingenuity has devised."</p>
                                    </div>
                                </div>
                                <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"></div>
                            </div>
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
