"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the main dashboard (root page)
        router.replace('/');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-slate-500">Redirecting to dashboard...</p>
            </div>
        </div>
    );
}
