"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Currency {
    code: string;
    name: string;
    symbol: string;
    flag: string;
}

export const CURRENCIES: Currency[] = [
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', flag: '🇸🇦' },
    { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', flag: '🇶🇦' },
    { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', flag: '🇰🇼' },
    { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع', flag: '🇴🇲' },
    { code: 'BHD', name: 'Bahraini Dinar', symbol: 'د.ب', flag: '🇧🇭' },
];

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    formatAmount: (amount: number) => string;
    resetCurrency: () => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrencyState] = useState<Currency>(CURRENCIES[0]); // Default to AED
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        // Load saved currency from localStorage based on current user
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                const userId = user.id;
                setCurrentUserId(userId);

                // Load user-specific currency preference
                const savedCurrencyCode = localStorage.getItem(`preferredCurrency_${userId}`);
                if (savedCurrencyCode) {
                    const savedCurrency = CURRENCIES.find(c => c.code === savedCurrencyCode);
                    if (savedCurrency) {
                        setCurrencyState(savedCurrency);
                    }
                } else {
                    // Reset to default if no preference for this user
                    setCurrencyState(CURRENCIES[0]);
                }
            } catch (e) {
                console.error('Error loading user currency preference:', e);
                setCurrencyState(CURRENCIES[0]);
            }
        } else {
            // No user logged in, reset to default
            setCurrentUserId(null);
            setCurrencyState(CURRENCIES[0]);
        }
    }, []); // Run once on mount

    // Watch for user changes (login/logout)
    useEffect(() => {
        const checkUserChange = () => {
            const savedUser = localStorage.getItem('user');

            if (savedUser) {
                try {
                    const user = JSON.parse(savedUser);
                    const userId = user.id;

                    // If user changed, reload currency
                    if (userId !== currentUserId) {
                        setCurrentUserId(userId);

                        // Load user-specific currency preference
                        const savedCurrencyCode = localStorage.getItem(`preferredCurrency_${userId}`);
                        if (savedCurrencyCode) {
                            const savedCurrency = CURRENCIES.find(c => c.code === savedCurrencyCode);
                            if (savedCurrency) {
                                setCurrencyState(savedCurrency);
                            } else {
                                setCurrencyState(CURRENCIES[0]);
                            }
                        } else {
                            // Reset to default if no preference for this user
                            setCurrencyState(CURRENCIES[0]);
                        }
                    }
                } catch (e) {
                    console.error('Error checking user change:', e);
                }
            } else if (currentUserId !== null) {
                // User logged out, reset
                setCurrentUserId(null);
                setCurrencyState(CURRENCIES[0]);
            }
        };

        // Check on interval (every 500ms)
        const interval = setInterval(checkUserChange, 500);

        return () => clearInterval(interval);
    }, [currentUserId]);

    const setCurrency = (newCurrency: Currency) => {
        setCurrencyState(newCurrency);

        // Save with user-specific key
        if (currentUserId) {
            localStorage.setItem(`preferredCurrency_${currentUserId}`, newCurrency.code);
        }
    };

    const resetCurrency = () => {
        setCurrencyState(CURRENCIES[0]); // Reset to default (AED)
        setCurrentUserId(null);
    };

    const formatAmount = (amount: number): string => {
        return `${currency.symbol} ${amount.toLocaleString()}`;
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount, resetCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}
