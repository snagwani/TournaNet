"use client";

import React from 'react';
import RequireAuth from '../../components/RequireAuth';
import LogoutButton from '../../components/LogoutButton';
import Link from 'next/link';

export default function ScorerLayout({ children }: { children: React.ReactNode }) {
    return (
        <RequireAuth allowedRoles={['SCORER', 'ADMIN']}>
            <div className="min-h-screen bg-neutral-950">
                <nav className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-xl sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <Link href="/scorer" className="flex items-center gap-2 group">
                                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                                    <span className="text-white font-black italic">S</span>
                                </div>
                                <span className="text-xl font-black text-white uppercase italic tracking-tighter">
                                    Scoring Center
                                </span>
                            </Link>
                        </div>

                        <LogoutButton />
                    </div>
                </nav>
                {children}
            </div>
        </RequireAuth>
    );
}
