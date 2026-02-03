"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../app/context/AuthContext';

interface Medalist {
    athleteName: string;
    schoolName: string;
}

interface ResultEntry {
    athleteId: string;
    athleteName: string;
    schoolName: string;
    bibNumber: number;
    status: string;
    resultValue: string | null;
    rank: number | null;
    notes: string | null;
}

interface EventDetail {
    eventId: string;
    eventName: string;
    eventType: string;
    category: string;
    gender: string;
    date: string;
    gold: Medalist | null;
    silver: Medalist | null;
    bronze: Medalist | null;
    results: ResultEntry[];
}

export default function EventDetailPage() {
    const { eventId } = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [event, setEvent] = useState<EventDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEventDetail = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:3001/api/admin/reports/events/${eventId}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Event not found');
                }
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to fetch event details');
            }

            const data = await response.json();
            setEvent(data);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        if (!user || !eventId) {
            setIsLoading(false);
            return;
        }
        fetchEventDetail();
    }, [user, eventId, fetchEventDetail]);

    return (
        <>
            {isLoading ? (
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                        <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest animate-pulse">
                            Synchronizing Event Data...
                        </p>
                    </div>
                </div>
            ) : error || !event ? (
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 p-8 rounded-[2rem] text-center space-y-6">
                        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center mx-auto text-red-500">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-white font-black text-2xl uppercase italic tracking-tight">System Interrupt</h2>
                            <p className="text-neutral-500 mt-2">{error || 'Event data could not be retrieved.'}</p>
                        </div>
                        <button
                            onClick={() => router.push('/admin/events')}
                            className="w-full py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-2xl transition-all uppercase text-xs tracking-widest"
                        >
                            Back to Event List
                        </button>
                    </div>
                </div>
            ) : (
                <main className="p-8 space-y-8 pb-16">
                    {/* Header with Navigation */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-4">
                            <button
                                onClick={() => router.push('/admin/events')}
                                className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors group"
                            >
                                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                <span className="text-[10px] font-black uppercase tracking-widest">Return to Ledger</span>
                            </button>

                            <div className="space-y-1">
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase italic">
                                    {event.eventName}
                                </h1>
                                <div className="flex items-center gap-3">
                                    <span className="px-2 py-0.5 bg-blue-500 text-neutral-950 rounded text-[10px] font-black font-mono">
                                        {event.category}
                                    </span>
                                    <span className="text-neutral-500 font-mono text-xs uppercase tracking-[0.2em]">
                                        {event.eventType} • {event.gender} • {new Date(event.date).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Medal Podium Summary */}
                        <div className="flex gap-4 p-4 bg-neutral-900/50 border border-neutral-800 rounded-3xl">
                            {[
                                { type: 'Gold', medal: event.gold, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                                { type: 'Silver', medal: event.silver, color: 'text-neutral-300', bg: 'bg-neutral-400/10' },
                                { type: 'Bronze', medal: event.bronze, color: 'text-amber-700', bg: 'bg-amber-800/10' }
                            ].map((m, idx) => (
                                <div key={idx} className={`w-24 p-3 rounded-2xl flex flex-col items-center text-center gap-1 ${m.bg} ${!m.medal && 'opacity-20'}`}>
                                    <span className={`text-[8px] font-black uppercase tracking-tighter ${m.color}`}>{m.type}</span>
                                    <p className="text-white font-bold text-[10px] leading-tight truncate w-full">
                                        {m.medal?.athleteName || '---'}
                                    </p>
                                    <p className="text-neutral-500 font-mono text-[8px] truncate w-full uppercase">
                                        {m.medal?.schoolName || 'Unassigned'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </header>

                    {/* Results Table */}
                    <section className="bg-neutral-900/30 border border-neutral-800 rounded-[2rem] overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/50">
                            <h2 className="text-xs font-black text-neutral-500 uppercase tracking-[0.3em]">Official Tournament Results</h2>
                            <span className="text-[10px] font-mono text-neutral-700">Records Processed • {event.results.length}</span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-neutral-800 text-neutral-600">
                                        <th className="px-6 py-4 text-[9px] font-mono uppercase tracking-widest">Rank</th>
                                        <th className="px-6 py-4 text-[9px] font-mono uppercase tracking-widest">Athlete Details</th>
                                        <th className="px-6 py-4 text-[9px] font-mono uppercase tracking-widest">Result</th>
                                        <th className="px-6 py-4 text-[9px] font-mono uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-[9px] font-mono uppercase tracking-widest text-right">Bib</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {event.results.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center">
                                                <p className="text-neutral-700 font-mono text-xs uppercase tracking-widest">No results synchronized for this event yet.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        event.results.map((result) => {
                                            const isPodium = result.rank && result.rank <= 3;
                                            return (
                                                <tr
                                                    key={result.athleteId}
                                                    className={`border-b border-neutral-800/50 transition-all group ${result.rank === 1 ? 'bg-amber-500/[0.03] hover:bg-amber-500/[0.05]' :
                                                        result.rank === 2 ? 'bg-neutral-400/[0.02] hover:bg-neutral-400/[0.04]' :
                                                            result.rank === 3 ? 'bg-amber-800/[0.02] hover:bg-amber-800/[0.04]' :
                                                                'hover:bg-white/[0.02]'
                                                        }`}
                                                >
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            {result.rank === 1 && (
                                                                <span className="text-xl" title="Gold Medal">🥇</span>
                                                            )}
                                                            {result.rank === 2 && (
                                                                <span className="text-xl" title="Silver Medal">🥈</span>
                                                            )}
                                                            {result.rank === 3 && (
                                                                <span className="text-xl" title="Bronze Medal">🥉</span>
                                                            )}
                                                            <span className={`text-sm font-black italic ${result.rank === 1 ? 'text-amber-400' :
                                                                result.rank === 2 ? 'text-neutral-300' :
                                                                    result.rank === 3 ? 'text-amber-700' : 'text-neutral-600'
                                                                }`}>
                                                                {result.rank ? `#${result.rank.toString().padStart(2, '0')}` : '--'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="space-y-0.5">
                                                            <p className={`font-bold uppercase tracking-tight transition-colors ${isPodium ? 'text-white' : 'text-neutral-300'
                                                                } group-hover:text-blue-400`}>
                                                                {result.athleteName}
                                                            </p>
                                                            <p className="text-neutral-500 font-mono text-[9px] uppercase tracking-wider">
                                                                {result.schoolName}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`font-mono text-xs font-bold px-3 py-1 rounded-full border ${isPodium
                                                            ? 'bg-neutral-800 text-white border-neutral-700'
                                                            : 'bg-neutral-900/50 text-neutral-500 border-neutral-800/50'
                                                            }`}>
                                                            {result.status === 'FINISHED' ? (result.resultValue || '---') : '---'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded border ${result.status === 'FINISHED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                            result.status === 'DNS' ? 'bg-neutral-500/10 border-neutral-500/20 text-neutral-500' :
                                                                'bg-red-500/10 border-red-500/20 text-red-400'
                                                            }`}>
                                                            {result.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right font-mono text-[10px] text-neutral-600">
                                                        {result.bibNumber.toString().padStart(3, '0')}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <footer className="pt-8 border-t border-neutral-900 text-center">
                        <p className="text-[10px] text-neutral-700 uppercase tracking-[0.4em] font-black italic">
                            TournaNet Certification Engine • Official Result Feed
                        </p>
                    </footer>
                </main>
            )}
        </>
    );
}
