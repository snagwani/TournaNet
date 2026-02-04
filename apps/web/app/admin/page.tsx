"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useAdminReport } from '@/hooks/useAdminReport';

interface OverviewStats {
    totalSchools: number;
    totalAthletes: number;
    totalEvents: number;
    eventsCompleted: number;
    eventsRemaining: number;
    medalsDistributed: number;
    lastUpdated: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const { user } = useAuth();

    const fetchOverviewFn = React.useCallback(async () => {
        const response = await fetch('http://localhost:3001/api/admin/overview', {
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Failed to fetch system overview');
        }
        return await response.json();
    }, []);

    const { data: stats, isLoading, error, refresh } = useAdminReport<OverviewStats>({
        fetchFn: fetchOverviewFn
    });

    const completionRate = stats ? Math.round((stats.eventsCompleted / stats.totalEvents) * 100) : 0;

    return (
        <main className="p-8 space-y-8 animate-in fade-in duration-700">
            <header className="flex justify-between items-end border-b border-neutral-800 pb-6">
                <div className="space-y-1">
                    <h2 className="text-sm font-mono uppercase tracking-[0.3em] text-neutral-500">
                        Operational Overview
                    </h2>
                    <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
                        System Status
                    </h1>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest mb-1">Last Updated</p>
                    <p className="text-xs font-bold text-neutral-400">
                        {stats ? new Date(stats.lastUpdated).toLocaleTimeString() : '--:--:--'}
                    </p>
                </div>
            </header>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-4 px-6 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                    <button onClick={() => refresh()} className="text-[10px] uppercase tracking-widest font-bold underline">Retry</button>
                </div>
            )}

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Schools */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2.5rem] p-8 space-y-4 hover:bg-neutral-900 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <svg className="w-24 h-24 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3L4 9v12h16V9l-8-6zm0 2.18L18 10.12V19H6v-8.88l6-4.94zM12 11c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Total Schools</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-5xl font-black text-white italic tracking-tighter">
                            {isLoading ? '...' : stats?.totalSchools || 0}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 text-blue-500 font-bold text-[10px] uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        Verified Districts
                    </div>
                </div>

                {/* Total Athletes */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2.5rem] p-8 space-y-4 hover:bg-neutral-900 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <svg className="w-24 h-24 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9 0c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm9 2c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4zM7 13c-2 0-6 1-6 3v3h5v-3c0-.85.34-2.11 1-3.04z" />
                        </svg>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Active Athletes</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-5xl font-black text-white italic tracking-tighter">
                            {isLoading ? '...' : stats?.totalAthletes || 0}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        Registered
                    </div>
                </div>

                {/* Events Progress */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2.5rem] p-8 space-y-4 hover:bg-neutral-900 transition-all group lg:col-span-2 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                        <div className="space-y-4 flex-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Tournament Progress</p>
                            <div className="flex items-baseline gap-3">
                                <h3 className="text-5xl font-black text-white italic tracking-tighter">
                                    {isLoading ? '...' : stats?.eventsCompleted || 0}
                                    <span className="text-2xl text-neutral-700 not-italic ml-2">/ {stats?.totalEvents || 0}</span>
                                </h3>
                                <span className="text-xs font-mono text-neutral-500">Events Finished</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-2xl font-black text-blue-500 italic">{completionRate}%</span>
                            <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Complete</span>
                        </div>
                    </div>

                    <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700/30 p-0.5">
                        <div
                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all duration-1000 ease-out"
                            style={{ width: `${completionRate}%` }}
                        />
                    </div>

                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-neutral-500">{stats?.eventsRemaining || 0} Events Pending</span>
                        <span className="text-emerald-500">{stats?.medalsDistributed || 0} Medals Distributed</span>
                    </div>
                </div>
            </section>

            {/* Quick Actions */}
            <section className="space-y-4">
                <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-neutral-600 ml-1">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        onClick={() => router.push('/admin/events/create')}
                        className="p-6 bg-blue-600/10 border border-blue-500/20 rounded-3xl text-left hover:bg-blue-600/20 transition-all group"
                    >
                        <div className="w-10 h-10 bg-blue-600 border border-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <span className="block text-white font-bold text-sm">Create New Event</span>
                        <span className="block text-blue-500/60 text-[10px] font-bold uppercase tracking-widest mt-1">Setup Heats & Rules</span>
                    </button>

                    <button
                        onClick={() => router.push('/admin/schools/register')}
                        className="p-6 bg-emerald-600/10 border border-emerald-500/20 rounded-3xl text-left hover:bg-emerald-600/20 transition-all group"
                    >
                        <div className="w-10 h-10 bg-emerald-600 border border-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <span className="block text-white font-bold text-sm">Register School</span>
                        <span className="block text-emerald-500/60 text-[10px] font-bold uppercase tracking-widest mt-1">Onboard Institutions</span>
                    </button>

                    <button
                        onClick={() => router.push('/admin/schedule')}
                        className="p-6 bg-amber-600/10 border border-amber-500/20 rounded-3xl text-left hover:bg-amber-600/20 transition-all group"
                    >
                        <div className="w-10 h-10 bg-amber-600 border border-amber-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className="block text-white font-bold text-sm">Review Schedule</span>
                        <span className="block text-amber-500/60 text-[10px] font-bold uppercase tracking-widest mt-1">Resolve Conflicts</span>
                    </button>

                    <button
                        onClick={() => router.push('/admin/athletes')}
                        className="p-6 bg-purple-600/10 border border-purple-500/20 rounded-3xl text-left hover:bg-purple-600/20 transition-all group"
                    >
                        <div className="w-10 h-10 bg-purple-600 border border-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <span className="block text-white font-bold text-sm">Athlete Reports</span>
                        <span className="block text-purple-500/60 text-[10px] font-bold uppercase tracking-widest mt-1">Performance Details</span>
                    </button>
                </div>
            </section>
        </main>
    );
}
