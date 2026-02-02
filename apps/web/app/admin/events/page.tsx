"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import RequireAuth from '../../../components/RequireAuth';
import { useAuth } from '../../../app/context/AuthContext';

interface Medalist {
    athleteName: string;
    schoolName: string;
}

interface EventReport {
    eventId: string;
    eventName: string;
    eventType: 'TRACK' | 'FIELD';
    category: string;
    gender: 'MALE' | 'FEMALE';
    date: string;
    status?: 'COMPLETED' | 'PENDING'; // Derived or optional from backend
    gold: Medalist | null;
    silver: Medalist | null;
    bronze: Medalist | null;
}

export default function EventReportsPage() {
    const router = useRouter();
    const [events, setEvents] = useState<EventReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3001/api/admin/reports/events', {
                credentials: 'include'
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to fetch event reports');
            }

            const data = await response.json();
            setEvents(data.events || []);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchEvents();
        }
    }, [user, fetchEvents]);

    return (
        <RequireAuth allowedRoles={['ADMIN']}>
            <main className="min-h-screen bg-neutral-950 p-8 space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-800 pb-6 gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                            Event Reports
                        </h1>
                        <p className="text-neutral-500 text-sm font-mono uppercase tracking-widest">
                            Tournament Analytics • Championship Standings
                        </p>
                    </div>
                    {error && (
                        <button
                            onClick={fetchEvents}
                            className="text-[10px] text-red-400 hover:text-white uppercase tracking-widest font-bold flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20 transition-all hover:bg-red-500/20"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Connection Error - Retry
                        </button>
                    )}
                </header>

                <section className="bg-neutral-900/30 border border-neutral-800 rounded-[2rem] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-neutral-900/50 border-b border-neutral-800">
                                    <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500">Event Info</th>
                                    <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">Category/Gender</th>
                                    <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500">Medal Summary</th>
                                    <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="border-b border-neutral-800/50">
                                            <td className="px-6 py-8">
                                                <div className="space-y-2">
                                                    <div className="h-5 w-48 bg-neutral-800 animate-pulse rounded-full" />
                                                    <div className="h-3 w-20 bg-neutral-900 animate-pulse rounded-full" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-8">
                                                <div className="flex justify-center gap-2">
                                                    <div className="h-5 w-10 bg-neutral-800 animate-pulse rounded" />
                                                    <div className="h-5 w-16 bg-neutral-800 animate-pulse rounded" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-8">
                                                <div className="flex gap-4">
                                                    <div className="h-10 w-10 bg-neutral-800 animate-pulse rounded-xl" />
                                                    <div className="h-10 w-10 bg-neutral-800 animate-pulse rounded-xl" />
                                                    <div className="h-10 w-10 bg-neutral-800 animate-pulse rounded-xl" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-8">
                                                <div className="h-5 w-24 bg-neutral-800 animate-pulse rounded-full ml-auto" />
                                            </td>
                                        </tr>
                                    ))
                                ) : events.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center space-y-4">
                                                <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-3xl flex items-center justify-center">
                                                    <svg className="w-8 h-8 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-white font-bold text-lg">No Event Data Available</p>
                                                    <p className="text-neutral-500 text-sm">Live tournament analytics will appear here as results are finalized.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    events.map((event) => (
                                        <tr
                                            key={event.eventId}
                                            onClick={() => router.push(`/admin/events/${event.eventId}`)}
                                            className="border-b border-neutral-800/50 hover:bg-white/[0.04] transition-all group cursor-pointer"
                                        >
                                            <td className="px-6 py-8">
                                                <div className="space-y-1">
                                                    <span className="text-lg font-black text-white group-hover:text-blue-400 transition-colors uppercase italic tracking-tighter block">
                                                        {event.eventName}
                                                    </span>
                                                    <span className="text-neutral-500 font-mono text-[10px] uppercase tracking-[0.2em]">
                                                        {event.eventType} • {new Date(event.date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded text-[10px] font-bold font-mono">
                                                        {event.category}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${event.gender === 'MALE'
                                                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                                        : 'bg-pink-500/10 border-pink-500/20 text-pink-400'
                                                        }`}>
                                                        {event.gender}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8">
                                                <div className="flex gap-4">
                                                    {[
                                                        { type: 'Gold', medal: event.gold, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                                                        { type: 'Silver', medal: event.silver, color: 'text-neutral-300', bg: 'bg-neutral-400/10', border: 'border-neutral-400/20' },
                                                        { type: 'Bronze', medal: event.bronze, color: 'text-amber-700', bg: 'bg-amber-800/10', border: 'border-amber-800/20' }
                                                    ].map((m, idx) => (
                                                        <div key={idx} className={`relative group/medal flex flex-col items-center justify-center w-12 h-12 rounded-xl border ${m.border} ${m.bg} ${!m.medal && 'opacity-20 grayscale'}`}>
                                                            <span className={`text-[10px] font-black italic ${m.color}`}>{m.type[0]}</span>
                                                            {m.medal && (
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl opacity-0 group-hover/medal:opacity-100 transition-all pointer-events-none z-10 scale-95 group-hover/medal:scale-100">
                                                                    <p className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold mb-1">{m.type} Medalist</p>
                                                                    <p className="text-white font-black italic uppercase text-xs truncate">{m.medal.athleteName}</p>
                                                                    <p className="text-blue-400 font-mono text-[9px] uppercase truncate">{m.medal.schoolName}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-8 text-right">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${event.gold
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                    }`}>
                                                    {event.gold ? 'COMPLETED' : 'PENDING'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <footer className="pt-8 border-t border-neutral-900 text-center">
                    <p className="text-[10px] text-neutral-700 uppercase tracking-[0.3em] font-medium">
                        TournaNet Real-Time Analytics • Build 2026.02.03
                    </p>
                </footer>
            </main>
        </RequireAuth>
    );
}
