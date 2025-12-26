"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../lib/auth-context';
import { usePathname } from 'next/navigation';

const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
const WARNING_BEFORE = 30 * 1000; // 30 seconds

export default function SessionTimeout() {
    const { isAuthenticated, logout } = useAuth();
    const pathname = usePathname();
    const [showAlert, setShowAlert] = useState(false);
    const [timeLeft, setTimeLeft] = useState(WARNING_BEFORE / 1000);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const warningRef = useRef<NodeJS.Timeout | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimer = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningRef.current) clearTimeout(warningRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);

        setShowAlert(false);
        setTimeLeft(WARNING_BEFORE / 1000);

        if (isAuthenticated) {
            // Set warning timer
            warningRef.current = setTimeout(() => {
                setShowAlert(true);
                // Start countdown
                countdownRef.current = setInterval(() => {
                    setTimeLeft((prev) => {
                        if (prev <= 1) {
                            if (countdownRef.current) clearInterval(countdownRef.current);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }, INACTIVITY_TIMEOUT - WARNING_BEFORE);

            // Set final logout timer
            timeoutRef.current = setTimeout(() => {
                logout();
            }, INACTIVITY_TIMEOUT);
        }
    }, [isAuthenticated, logout]);

    useEffect(() => {
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click'
        ];

        const handleActivity = () => {
            if (!showAlert) {
                resetTimer();
            }
        };

        if (isAuthenticated) {
            resetTimer();
            events.forEach(event => {
                window.addEventListener(event, handleActivity);
            });
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (warningRef.current) clearTimeout(warningRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [isAuthenticated, resetTimer, showAlert]);

    if (!isAuthenticated || !showAlert) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Session Expiring</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        You have been inactive for a while. You will be logged out in <span className="font-bold text-amber-600 dark:text-amber-400">{timeLeft} seconds</span> for security.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={resetTimer}
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-indigo-600/20"
                        >
                            Stay Logged In
                        </button>
                        <button
                            onClick={() => logout()}
                            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-colors"
                        >
                            Logout Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
