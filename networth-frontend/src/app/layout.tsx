import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../lib/auth-context";
import { CurrencyProvider } from "../lib/currency-context";
import { NetWorthProvider } from "../lib/networth-context";
import Layout from "../components/Layout";
import SessionTimeout from "../components/auth/SessionTimeout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Net Worth Tracker",
    description: "Personal finance and net worth tracking application",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AuthProvider>
                    <SessionTimeout />
                    <CurrencyProvider>
                        <NetWorthProvider>
                            <Layout>{children}</Layout>
                        </NetWorthProvider>
                    </CurrencyProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
