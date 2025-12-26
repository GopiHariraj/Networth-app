"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api/client';
import { useAuth } from '../../../lib/auth-context';

function ResetPasswordLogic() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const { login } = useAuth();
    const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMessage('No reset token provided.');
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await apiClient.post('/auth/magic-login', { token });
                // If successful, we get token and user
                login(res.data.access_token, res.data.user);
                setStatus('success');
                // Login redirects, but just in case
            } catch (err: any) {
                setStatus('error');
                setErrorMessage(err.response?.data?.message || 'Invalid or expired reset token.');
            }
        };

        verifyToken();
    }, [token, login]);

    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Verifying Token...</h2>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="text-center p-8 max-w-md mx-auto">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="font-medium">{errorMessage}</p>
                </div>
                <button
                    onClick={() => router.push('/login')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    Back to Login
                </button>
            </div>
        );
    }

    return null; // Redirecting...
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-700">
                <Suspense fallback={<div>Loading...</div>}>
                    <ResetPasswordLogic />
                </Suspense>
            </div>
        </div>
    );
}
