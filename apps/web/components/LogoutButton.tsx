"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../app/context/AuthContext';

export default function LogoutButton() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    if (!user) return null;

    return (
        <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                    {user.role}
                </span>
            </div>

            <button
                onClick={handleLogout}
                className="group flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-red-500/10 border border-neutral-700 hover:border-red-500/50 rounded-xl transition-all duration-300"
            >
                <span className="text-xs font-bold text-neutral-400 group-hover:text-red-500 tracking-tight transition-colors">
                    Logout
                </span>
                <svg
                    className="w-4 h-4 text-neutral-500 group-hover:text-red-500 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            </button>
        </div>
    );
}
