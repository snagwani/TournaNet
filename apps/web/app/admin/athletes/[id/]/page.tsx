"use client";

import React, { useState, useEffect, useCallback } from 'react';
import RequireAuth from '../../../../components/RequireAuth';
import { useAuth } from '../../../../app/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AthleteEvent {
    eventId: string;
    eventName: string;
    eventType: string;
    date: string;
    rank: number | null;
    resultValue: string | null;
    status: string;
    notes: string | null;
}

interface AthleteDetail {
    athleteId: string;
    athleteName: string;
    bibNumber: number;
    schoolName: string;
    category: string;
    gender: string;
    personalBest: string | null;
    events: AthleteEvent[];
}

export default function AthleteDetailPage({ params }: { params: { id: string } }) {
    const [athlete, setAthlete] = useState<AthleteDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { accessToken } = useAuth();
    const router = useRouter();

    const fetchAthleteDetail = useCallback(async () => {
        if (!accessToken) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:3001/api/admin/reports/athletes/${params.id}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to fetch athlete details');
            }

            const data = await response.json();
            setAthlete(data);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [accessToken, params.id]);

    useEffect(() => {
        fetchAthleteDetail();
    }, [fetchAthleteDetail]);

    return (
        <RequireAuth allowedRoles={['ADMIN']}>
            <main className="min-h-screen bg-neutral-950 p-8 space-y-8">
                <header className="flex justify-between items-start border-b border-neutral-800 pb-6">
                    <div className="space-y-4">
                        <Link
                            href="/admin/athletes"
                            className="text-xs font-mono uppercase tracking-widest text-neutral-500 hover:text-white transition-colors flex items-center gap-2 group"
                        >
                            <svg className="w-3 h-3 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Athletes
                        </Link>
                        <div className="space-y-1">
                            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
                                {athlete?.athleteName || 'Athlete Profile'}
                            </h1>
                            <div className="flex flex-wrap gap-3 items-center">
                                <span className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 font-mono text-xs uppercase tracking-tight">
                                    #{athlete?.bibNumber}
                                </span>
                                <span className="text-neutral-500 text-sm font-mono uppercase tracking-widest">
                                    {athlete?.schoolName}
                                </span>
                                {athlete && (
                                    <>
                                        <span className="w-1 h-1 bg-neutral-800 rounded-full" />
                                        <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded text-[10px] font-bold font-mono">
                                            {athlete.category}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${athlete.gender === 'MALE'
                                                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                                : 'bg-pink-500/10 border-pink-500/20 text-pink-400'
                                            }`}>
                                            {athlete.gender}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => fetchAthleteDetail()}
                        disabled={isLoading}
                        className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-[10px] font-bold text-neutral-400 uppercase tracking-widest hover:text-white hover:border-neutral-700 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        <svg className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh Profile
                    </button>
                </header>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-4 px-6 rounded-2xl flex items-center justify-between">
                        <span className="font-medium">{error}</span>
                        <button onClick={() => fetchAthleteDetail()} className="underline font-bold">Try Again</button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <section className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Participation History</h2>
                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-[2rem] overflow-hidden shadow-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-neutral-900/50 border-b border-neutral-800">
                                        <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-neutral-500">Event</th>
                                        <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">Status</th>
                                        <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">Result</th>
                                        <th className="px-6 py-4 text-xs font-mono uppercase tracking-widest text-neutral-500 text-right">Rank</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <tr key={i} className="border-b border-neutral-800/50">
                                                <td className="px-6 py-6"><div className="h-4 w-32 bg-neutral-800 animate-pulse rounded-full" /></td>
                                                <td className="px-6 py-6"><div className="h-4 w-16 bg-neutral-800 animate-pulse rounded-full mx-auto" /></td>
                                                <td className="px-6 py-6"><div className="h-4 w-12 bg-neutral-800 animate-pulse rounded-full mx-auto" /></td>
                                                <td className="px-6 py-6"><div className="h-6 w-8 bg-neutral-800 animate-pulse rounded-full ml-auto" /></td>
                                            </tr>
                                        ))
                                    ) : athlete?.events.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-neutral-500 font-mono text-xs uppercase tracking-widest">
                                                No events recorded
                                            </td>
                                        </tr>
                                    ) : (
                                        athlete?.events.map((event) => (
                                            <tr key={event.eventId} className="border-b border-neutral-800/50 hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-bold capitalize">{event.eventName}</span>
                                                        <span className="text-[10px] text-neutral-600 font-mono uppercase">{event.eventType}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase border ${event.status === 'FINISHED' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                                                            event.status === 'DNS' ? 'bg-neutral-800 border-neutral-700 text-neutral-500' :
                                                                'bg-red-500/10 border-red-500/20 text-red-500'
                                                        }`}>
                                                        {event.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <span className="text-neutral-300 font-mono text-sm">{event.resultValue || '—'}</span>
                                                </td>
                                                <td className="px-6 py-6 text-right">
                                                    {event.rank ? (
                                                        <span className={`text-2xl font-black italic ${event.rank === 1 ? 'text-yellow-500' :
                                                                event.rank === 2 ? 'text-neutral-400' :
                                                                    event.rank === 3 ? 'text-amber-700' : 'text-neutral-600'
                                                            }`}>
                                                            {event.rank}
                                                        </span>
                                                    ) : (
                                                        <span className="text-neutral-800 text-xs font-mono">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <aside className="space-y-6">
                        <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Bio & Records</h2>
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-[2rem] p-6 space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em]">Personal Best</label>
                                <p className="text-2xl font-black text-white tracking-widest italic">{athlete?.personalBest || 'TBD'}</p>
                            </div>
                            <div className="h-px bg-neutral-800" />
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-neutral-500 uppercase tracking-widest font-mono">Total Medals</span>
                                    <span className="text-white font-bold">{athlete?.events.filter(e => e.rank && e.rank <= 3).length || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-neutral-500 uppercase tracking-widest font-mono">Total Finalized</span>
                                    <span className="text-white font-bold">{athlete?.events.filter(e => e.status === 'FINISHED').length || 0}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-neutral-500 uppercase tracking-widest font-mono">Participation Rate</span>
                                    <span className="text-white font-bold">
                                        {athlete && athlete.events.length > 0
                                            ? Math.round((athlete.events.filter(e => e.status === 'FINISHED').length / athlete.events.length) * 100)
                                            : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </RequireAuth>
    );
}
