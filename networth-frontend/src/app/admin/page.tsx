"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../lib/api/client';

export default function AdminPage() {
    const { user: currentUser, isAuthenticated } = useAuth();
    const router = useRouter();

    const [users, setUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'USER' });

    // Edit User State
    const [editingUser, setEditingUser] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [resetLink, setResetLink] = useState('');
    const [showResetModal, setShowResetModal] = useState(false);

    // Fetch users on mount
    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        if (currentUser?.role !== 'SUPER_ADMIN') {
            return;
        }
        fetchUsers();
    }, [currentUser, isAuthenticated]);

    // Filter users when search or filter changes
    useEffect(() => {
        filterUsers();
    }, [searchQuery, roleFilter, users]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setMessage('❌ Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        let filtered = [...users];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(u =>
                u.email?.toLowerCase().includes(query) ||
                `${u.firstName} ${u.lastName}`.toLowerCase().includes(query)
            );
        }

        // Role filter
        if (roleFilter !== 'ALL') {
            filtered = filtered.filter(u => u.role === roleFilter);
        }

        setFilteredUsers(filtered);
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setIsLoading(true);
        try {
            await apiClient.post('/users', {
                firstName: newUser.name.split(' ')[0] || newUser.name,
                lastName: newUser.name.split(' ').slice(1).join(' ') || '',
                email: newUser.email,
                password: newUser.password,
                role: newUser.role
            });
            setMessage(`✅ Success: User ${newUser.name} created!`);
            setNewUser({ name: '', email: '', password: '', role: 'USER' });
            fetchUsers();
        } catch (error: any) {
            setMessage(`❌ Error: ${error.response?.data?.message || 'Failed to create user.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to generate a password reset link for ${userName}?`)) return;

        try {
            const res = await apiClient.post('/users/reset-password', { userId });
            setResetLink(res.data.resetLink);
            setShowResetModal(true);
            setMessage(`Success: Reset link generated for ${userName}`);
        } catch (error: any) {
            setMessage(error.response?.data?.message || 'Failed to generate reset link.');
        }
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!confirm(`⚠️ Are you sure you want to delete user "${userName}"?\n\nThis action cannot be undone.`)) return;

        try {
            await apiClient.delete(`/users/${userId}`);
            setMessage(`✅ Success: User "${userName}" has been deleted`);
            fetchUsers();
        } catch (error: any) {
            setMessage(`❌ Error: ${error.response?.data?.message || 'Failed to delete user'}`);
        }
    };

    const handleEditUser = (user: any) => {
        setEditingUser({
            ...user,
            name: user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName
        });
        setShowEditModal(true);
    };

    const handleSaveUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setMessage('');
        setIsLoading(true);

        try {
            await apiClient.put(`/users/${editingUser.id}`, {
                firstName: editingUser.name?.split(' ')[0] || editingUser.firstName,
                lastName: editingUser.name?.split(' ').slice(1).join(' ') || '',
                email: editingUser.email,
                role: editingUser.role
            });
            setMessage(`✅ Success: User updated!`);
            setShowEditModal(false);
            setEditingUser(null);
            fetchUsers();
        } catch (error: any) {
            setMessage(`❌ Error: ${error.response?.data?.message || 'Failed to update user.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetDatabase = async () => {
        const confirmed = confirm(
            '⚠️ DATABASE RESET WARNING\n\n' +
            'This will DELETE ALL DATA including:\n' +
            '• All users (except admin)\n' +
            '• All financial assets and liabilities\n' +
            '• All transactions and expenses\n\n' +
            'This action CANNOT be undone!\n\n' +
            'Are you sure you want to continue?'
        );

        if (!confirmed) return;

        const confirmation = prompt('Type "RESET DATABASE" to confirm:');
        if (confirmation !== 'RESET DATABASE') {
            setMessage('❌ Database reset cancelled');
            return;
        }

        setIsLoading(true);
        try {
            const res = await apiClient.post('/admin/reset-database');
            const { deletedRecords } = res.data;
            setMessage(`✅ Database reset successful! Deleted: ${Object.values(deletedRecords).reduce((a: any, b: any) => a + b, 0)} records.`);
            fetchUsers();
        } catch (error: any) {
            setMessage(`❌ Error: ${error.response?.data?.message || 'Failed to reset database'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackup = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.post('/admin/export-data');
            const dataStr = JSON.stringify(res.data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `networth-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            window.URL.revokeObjectURL(url);
            setMessage('✅ Complete backup created successfully!');
        } catch (error: any) {
            setMessage('❌ Failed to create backup');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const backupData = JSON.parse(e.target?.result as string);
                if (!confirm(`⚠️ RESTORE DATA?\n\nThis will OVERWRITE your current database.\n\nContinue?`)) return;

                setIsLoading(true);
                await apiClient.post('/admin/import-data', backupData);
                setMessage('✅ Complete restore successful! Refreshing...');
                setTimeout(() => window.location.reload(), 2000);
            } catch (error) {
                setMessage('❌ Error restoring backup');
            } finally {
                setIsLoading(false);
            }
        };
        reader.readAsText(file);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">🔄</div>
                    <p className="text-slate-600 dark:text-slate-400 font-bold">Initializing Admin Portal...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || currentUser?.role !== 'SUPER_ADMIN') {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-4xl mb-6">🚫</div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
                <p className="text-slate-500 dark:text-slate-400 text-center max-w-xs">
                    You do not have the necessary permissions to access the administrative dashboard.
                </p>
                <button onClick={() => router.push('/')} className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/25">
                    Return Home
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-900 dark:to-black p-8 md:p-12 rounded-[2.5rem] text-white shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold mb-4 uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                            System Administration
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Admin Dashboard</h1>
                        <p className="text-slate-400 text-lg font-medium max-w-xl">
                            Oversee platform health, manage user accounts, and maintain data integrity.
                        </p>
                    </div>
                </div>
            </div>

            {/* Alert & Status Bar */}
            {message && (
                <div className={`p-4 rounded-2xl border flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500 ${message.includes('❌')
                    ? 'bg-red-50 border-red-100 text-red-700 dark:bg-red-900/10'
                    : 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/10'}`}>
                    <div className="text-xl">{message.includes('❌') ? '⚠️' : '✨'}</div>
                    <p className="font-semibold text-sm">{message}</p>
                    <button onClick={() => setMessage('')} className="ml-auto opacity-50 hover:opacity-100">×</button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-8 space-y-8">
                    {/* User Management */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl">👥</span>
                                    User Management
                                </h2>
                                <p className="text-slate-500 text-sm mt-1">Found {users.length} registered users</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 text-xs font-bold uppercase tracking-widest">
                                    <tr>
                                        <th className="px-8 py-5">Full Name</th>
                                        <th className="px-6 py-5">Email Address</th>
                                        <th className="px-6 py-5">Role</th>
                                        <th className="px-8 py-5 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredUsers.map((u) => (
                                        <tr key={u.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/5 transition-colors">
                                            <td className="px-8 py-5 font-bold text-slate-900 dark:text-white capitalize">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-black text-slate-500">
                                                        {u.firstName?.charAt(0) || u.email?.slice(0, 1).toUpperCase()}
                                                    </div>
                                                    <div>{u.firstName} {u.lastName}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-slate-500 font-medium">{u.email}</td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {u.role.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right whitespace-nowrap">
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={() => handleEditUser(u)} className="p-2 bg-slate-100 hover:bg-blue-100 rounded-lg transition-colors" title="Edit User">✏️</button>
                                                    <button onClick={() => handleResetPassword(u.id, u.firstName)} className="p-2 bg-slate-100 hover:bg-amber-100 rounded-lg transition-colors" title="Reset Password">🔑</button>
                                                    <button onClick={() => handleDeleteUser(u.id, u.firstName || u.email)} className="p-2 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg transition-colors" title="Delete User">🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Data Tools */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Backup & Restore</h3>
                            <div className="space-y-4">
                                <button onClick={handleBackup} disabled={isLoading} className="w-full p-4 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 rounded-2xl transition-all flex items-center gap-4 disabled:opacity-50">
                                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">📥</div>
                                    <div className="text-left font-bold">Generate Snapshot</div>
                                </button>
                                <label className="w-full p-4 bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 rounded-2xl transition-all flex items-center gap-4 cursor-pointer">
                                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">📤</div>
                                    <div className="text-left font-bold">Restore Data</div>
                                    <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                                </label>
                            </div>
                        </div>

                        <div className="bg-red-50/50 dark:bg-red-900/5 rounded-[2.5rem] border-2 border-red-100 dark:border-red-900/30 p-8 shadow-sm">
                            <h3 className="text-xl font-bold text-red-900 dark:text-red-400 mb-6">Danger Zone</h3>
                            <button onClick={handleResetDatabase} disabled={isLoading} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-50">
                                {isLoading ? 'Processing...' : '⚠️ Factory Reset'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm sticky top-8 overflow-hidden">
                        <div className="p-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                            <h2 className="text-2xl font-black">Add New Admin</h2>
                        </div>
                        <div className="p-8">
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <input
                                    type="text" required
                                    placeholder="Full Name"
                                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-medium"
                                    value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                />
                                <input
                                    type="email" required
                                    placeholder="Email Address"
                                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-medium"
                                    value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                />
                                <input
                                    type="password" required
                                    placeholder="Password"
                                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-medium"
                                    value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                />
                                <select
                                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-bold appearance-none cursor-pointer"
                                    value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                >
                                    <option value="USER">Standard User</option>
                                    <option value="SUPER_ADMIN">System Admin</option>
                                </select>
                                <button type="submit" disabled={isLoading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50">
                                    Provision Account
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reset Password Modal */}
            {showResetModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-md w-full p-8">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🔑</div>
                            <h2 className="text-2xl font-black">Reset Link Ready</h2>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border mb-6 break-all">
                            <p className="text-xs font-mono text-blue-600">{resetLink}</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { navigator.clipboard.writeText(resetLink); setMessage('✅ Copied!'); }} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl">Copy</button>
                            <button onClick={() => setShowResetModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 font-bold rounded-2xl">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-md w-full p-8">
                        <h2 className="text-2xl font-black mb-6">Edit User</h2>
                        <form onSubmit={handleSaveUpdate} className="space-y-4">
                            <input
                                type="text" required
                                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-medium"
                                value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                            />
                            <input
                                type="email" required
                                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-medium"
                                value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                            />
                            <select
                                className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none outline-none font-bold"
                                value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                            >
                                <option value="USER">User</option>
                                <option value="SUPER_ADMIN">System Admin</option>
                            </select>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 font-bold rounded-2xl">Cancel</button>
                                <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
