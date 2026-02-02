"use client";

import React, { useState, useEffect, useCallback } from 'react';
import RequireAuth from '../../../components/RequireAuth';
import { useAuth } from '../../../app/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Medalist {
    athleteName: string;
    schoolName: string;
}

interface EventResult {
    athleteId: string;
    bibNumber: number;
    status: string;
    resultValue: string | null;
    rank: number | null;
    notes: string | null;
}

interface EventReport {
    eventId: string;
    eventName: string;
    category: string;
    gender: string;
    gold: Medalist | null;
    silver: Medalist | null;
    bronze: Medalist | null;
    results: EventResult[];
}

export default function EventsReportPage() {
    const [events, setEvents] = useState<EventReport[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { accessToken } = useAuth();
    const router = useRouter();

    const fetchEvents = useCallback(async () => {
        if (!accessToken) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3001/api/admin/reports/events', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
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
    }, [accessToken]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const selectedEvent = events.find(e => e.eventId === selectedEventId);

    return (
        <RequireAuth allowedRoles={['ADMIN']}>
            <div className="flex min-h-screen bg-neutral-950">
                <main className={`flex-1 p-8 space-y-8 transition-all duration-500 ${selectedEventId ? 'mr-[400px]' : ''}`}>
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-800 pb-6 gap-4">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                                Event Results & Podium
                            </h1>
                            <p className="text-neutral-500 text-sm font-mono uppercase tracking-widest">
                                Tournament Analytics • Medal Distribution
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => fetchEvents()}
                                disabled={isLoading}
                                className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-[10px] font-bold text-neutral-400 uppercase tracking-widest hover:text-white hover:border-neutral-700 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                <svg className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh Results
                            </button>
                        </div>
                    </header>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-4 px-6 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium">{error}</span>
                            </div>
                            <button
                                onClick={() => fetchEvents()}
                                className="text-[10px] uppercase tracking-widest underline decoration-2 underline-offset-4 font-bold"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    <section className="bg-neutral-900/30 border border-neutral-800 rounded-[2rem] overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-neutral-900/50 border-b border-neutral-800">
                                        <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500">Event Details</th>
                                        <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">Status</th>
                                        <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-yellow-400" /> Gold
                                            </div>
                                        </th>
                                        <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-neutral-300" /> Silver
                                            </div>
                                        </th>
                                        <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-amber-600" /> Bronze
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        Array.from({ length: 6 }).map((_, i) => (
                                            <tr key={i} className="border-b border-neutral-800/50">
                                                <td className="px-6 py-6 font-bold space-y-2">
                                                    <div className="h-4 w-40 bg-neutral-800/50 animate-pulse rounded-full" />
                                                    <div className="h-3 w-20 bg-neutral-800/50 animate-pulse rounded-full opacity-50" />
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <div className="h-4 w-16 bg-neutral-800/50 animate-pulse rounded-full mx-auto" />
                                                </td>
                                                {[1, 2, 3].map(j => (
                                                    <td key={j} className="px-6 py-6">
                                                        <div className="space-y-2 mx-auto max-w-[120px]">
                                                            <div className="h-3 w-full bg-neutral-800/50 animate-pulse rounded-full" />
                                                            <div className="h-2 w-2/3 bg-neutral-800/50 animate-pulse rounded-full opacity-30 mx-auto" />
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : events.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-24 text-center">
                                                <div className="flex flex-col items-center space-y-4">
                                                    <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-3xl flex items-center justify-center">
                                                        <svg className="w-8 h-8 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-white font-bold text-lg">No Event Results Yet</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        events.map((event) => {
                                            const isCompleted = !!event.gold;
                                            const isSelected = selectedEventId === event.eventId;
                                            return (
                                                <tr
                                                    key={event.eventId}
                                                    onClick={() => setSelectedEventId(isSelected ? null : event.eventId)}
                                                    className={`border-b border-neutral-800/50 hover:bg-white/[0.04] transition-all group cursor-pointer ${isSelected ? 'bg-white/[0.04]' : ''}`}
                                                >
                                                    <td className="px-6 py-6 text-left">
                                                        <div className="flex flex-col">
                                                            <span className="text-white font-bold group-hover:text-white transition-colors capitalize">
                                                                {event.eventName}
                                                            </span>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-[9px] font-mono font-bold text-neutral-500 uppercase">
                                                                    {event.category}
                                                                </span>
                                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${event.gender === 'MALE' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-pink-500/10 text-pink-400'
                                                                    }`}>
                                                                    {event.gender}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${isCompleted
                                                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                                            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 animate-pulse'
                                                            }`}>
                                                            {isCompleted ? 'Completed' : 'Pending'}
                                                        </span>
                                                    </td>
                                                    {/* Medalist Columns */}
                                                    {[event.gold, event.silver, event.bronze].map((medalist, idx) => (
                                                        <td key={idx} className="px-6 py-6 text-center">
                                                            {medalist ? (
                                                                <div className="flex flex-col animate-in fade-in zoom-in duration-300">
                                                                    <span className="text-white font-bold text-sm tracking-tight">{medalist.athleteName}</span>
                                                                    <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-tighter truncate max-w-[120px] mx-auto">
                                                                        {medalist.schoolName}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-neutral-800 font-mono text-[10px]">Pending</span>
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <footer className="pt-8 border-t border-neutral-900 text-center">
                        <p className="text-[10px] text-neutral-700 uppercase tracking-[0.3em] font-medium">
                            TournaNet Analytics Engine • Build 2026.02.02
                        </p>
                    </footer>
                </main>

                {/* Leaderboard Drawer */}
                <aside
                    className={`fixed top-0 right-0 h-full w-[400px] bg-neutral-900 border-l border-neutral-800 shadow-2xl transition-transform duration-500 z-50 ${selectedEventId ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    {selectedEvent && (
                        <div className="flex flex-col h-full bg-neutral-950">
                            <header className="p-8 border-b border-neutral-800 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Event Leaderboard</h2>
                                    <button
                                        onClick={() => setSelectedEventId(null)}
                                        className="p-2 hover:bg-neutral-900 rounded-full text-neutral-500 hover:text-white transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" />
                                        </svg>
                                    </button>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-widest">{selectedEvent.eventName}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded text-[10px] font-mono font-bold text-neutral-500 uppercase">
                                            {selectedEvent.category}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${selectedEvent.gender === 'MALE' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-pink-500/10 text-pink-400'}`}>
                                            {selectedEvent.gender}
                                        </span>
                                    </div>
                                </div>
                            </header>

                            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                                <h4 className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.3em]">Full Rankings</h4>
                                <div className="space-y-3">
                                    {selectedEvent.results.length === 0 ? (
                                        <p className="text-center text-neutral-700 font-mono text-xs uppercase py-12">No rankings available yet</p>
                                    ) : (
                                        selectedEvent.results.map((res, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex items-center justify-between p-4 bg-neutral-900/50 border rounded-2xl transition-all ${res.rank === 1 ? 'border-yellow-500/30' :
                                                    res.rank === 2 ? 'border-neutral-400/30' :
                                                        res.rank === 3 ? 'border-amber-700/30' : 'border-neutral-800'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black italic shadow-inner ${res.rank === 1 ? 'bg-yellow-500 text-neutral-950' :
                                                        res.rank === 2 ? 'bg-neutral-300 text-neutral-900' :
                                                            res.rank === 3 ? 'bg-amber-600 text-neutral-950' : 'bg-neutral-800 text-neutral-500'
                                                        }`}>
                                                        {res.rank || '-'}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-white font-bold text-xs uppercase tracking-tight">Bib #{res.bibNumber}</span>
                                                            <span className={`text-[9px] font-mono font-bold uppercase ${res.status === 'FINISHED' ? 'text-green-500' : 'text-red-500'
                                                                }`}>
                                                                {res.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-neutral-400 text-[10px] font-medium leading-tight mt-0.5">{res.notes || 'No extra notes'}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-white font-black font-mono italic text-sm">{res.resultValue || '-'}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </RequireAuth>
    );
}
