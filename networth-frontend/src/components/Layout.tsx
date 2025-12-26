"use client";

import React, { useState, useEffect } from 'react';
import Sidebar, { HamburgerButton } from './Sidebar';
import Calculator from './Calculator';
import { useAuth } from '../lib/auth-context';

// Breakpoint constants
const BREAKPOINTS = {
    MOBILE: 768,
    TABLET: 1024
};

export default function Layout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile drawer state
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop collapse state
    const [isMobile, setIsMobile] = useState(false);
    const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

    // Initialize and handle responsive behavior
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;

            // Determine screen size category
            let newScreenSize: 'mobile' | 'tablet' | 'desktop';
            if (width < BREAKPOINTS.MOBILE) {
                newScreenSize = 'mobile';
                setIsMobile(true);
                setIsSidebarOpen(false); // Auto-hide on mobile
            } else if (width < BREAKPOINTS.TABLET) {
                newScreenSize = 'tablet';
                setIsMobile(false);
                setIsSidebarCollapsed(true); // Auto-collapse on tablet
            } else {
                newScreenSize = 'desktop';
                setIsMobile(false);
                // On desktop, restore user preference from localStorage
                const saved = localStorage.getItem('sidebar-collapsed');
                if (saved !== null) {
                    setIsSidebarCollapsed(JSON.parse(saved));
                } else {
                    setIsSidebarCollapsed(false); // Default to expanded
                }
            }

            setScreenSize(newScreenSize);
        };

        // Initial check
        handleResize();

        // Add resize listener with debounce for better performance
        let resizeTimer: NodeJS.Timeout;
        const debouncedResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(handleResize, 100);
        };

        window.addEventListener('resize', debouncedResize);
        return () => {
            window.removeEventListener('resize', debouncedResize);
            clearTimeout(resizeTimer);
        };
    }, []);

    // Save collapse state to localStorage (only on desktop when user manually toggles)
    const toggleCollapse = () => {
        const newState = !isSidebarCollapsed;
        setIsSidebarCollapsed(newState);

        // Only save to localStorage on desktop (user preference)
        if (screenSize === 'desktop') {
            localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
        }
    };

    // Toggle mobile drawer
    const toggleOpen = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Calculate main content padding based on sidebar state
    const getContentPadding = () => {
        if (!isAuthenticated) return '';
        if (isMobile) return '';
        return isSidebarCollapsed ? 'pl-20' : 'pl-64';
    };

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
            {isAuthenticated && (
                <Sidebar
                    isOpen={isSidebarOpen}
                    isCollapsed={isSidebarCollapsed}
                    onToggleOpen={toggleOpen}
                    onToggleCollapse={toggleCollapse}
                />
            )}

            <div className={`flex-1 transition-all duration-300 ${getContentPadding()}`}>
                {/* Header with Hamburger */}
                {isAuthenticated && isMobile && (
                    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 z-20 flex items-center gap-4">
                        <HamburgerButton onClick={toggleOpen} isOpen={isSidebarOpen} />
                        <h1 className="font-bold text-lg text-slate-900 dark:text-white">E-Daily</h1>
                    </header>
                )}

                <div className={isMobile && isAuthenticated ? 'pt-16' : ''}>
                    {children}
                </div>
            </div>

            {isAuthenticated && <Calculator />}
        </div>
    );
}
