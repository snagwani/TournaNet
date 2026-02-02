"use client";

import React, { useState, useEffect } from 'react';
import RequireAuth from '../../../components/RequireAuth';

interface EventReport {
    id: string;
    name: string;
    eventType: 'TRACK' | 'FIELD';
    category: string;
    gender: 'MALE' | 'FEMALE';
    status: 'COMPLETED' | 'PENDING';
}

const MOCK_EVENTS: EventReport[] = [
    { id: '1', name: '100m Dash', eventType: 'TRACK', category: 'U19', gender: 'MALE', status: 'COMPLETED' },
    { id: '2', name: 'High Jump', eventType: 'FIELD', category: 'U17', gender: 'FEMALE', status: 'PENDING' },
    { id: '3', name: '400m Relay', eventType: 'TRACK', category: 'U14', gender: 'MALE', status: 'COMPLETED' },
    { id: '4', name: 'Long Jump', eventType: 'FIELD', category: 'U19', gender: 'MALE', status: 'PENDING' },
    { id: '5', name: 'Shot Put', eventType: 'FIELD', category: 'U17', gender: 'FEMALE', status: 'COMPLETED' },
];

export default function EventReportsPage() {
    const [events, setEvents] = useState<EventReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate API fetch
        const timer = setTimeout(() => {
            setEvents(MOCK_EVENTS);
            setIsLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    return (
        <RequireAuth allowedRoles={['ADMIN']}>
            <main className="min-h-screen bg-neutral-950 p-8 space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-800 pb-6 gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                            Event Reports
                        </h1>
                        <p className="text-neutral-500 text-sm font-mono uppercase tracking-widest">
                            Tournament Analytics • Event Lifecycle
                        </p>
                    </div>
                </header>

                <section className="bg-neutral-900/30 border border-neutral-800 rounded-[2rem] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-neutral-900/50 border-b border-neutral-800">
                                    <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500">Event Name</th>
                                    <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500">Type</th>
                                    <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">Category</th>
                                    <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">Gender</th>
                                    <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="border-b border-neutral-800/50">
                                            <td className="px-6 py-6 font-bold">
                                                <div className="h-4 w-32 bg-neutral-800/50 animate-pulse rounded-full" />
                                            </td>
                                            <td className="px-6 py-6 font-bold text-neutral-600">
                                                <div className="h-3 w-16 bg-neutral-800/50 animate-pulse rounded-full" />
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="h-4 w-12 bg-neutral-800/50 animate-pulse rounded-full mx-auto" />
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="h-4 w-12 bg-neutral-800/50 animate-pulse rounded-full mx-auto" />
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="h-5 w-20 bg-neutral-800/50 animate-pulse rounded-full ml-auto" />
                                            </td>
                                        </tr>
                                    ))
                                ) : events.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center space-y-4">
                                                <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-3xl flex items-center justify-center">
                                                    <svg className="w-8 h-8 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-white font-bold text-lg">No Events Scheduled</p>
                                                    <p className="text-neutral-500 text-sm">Tournament events will appear here once configured.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    events.map((event) => (
                                        <tr key={event.id} className="border-b border-neutral-800/50 hover:bg-white/[0.04] transition-colors group">
                                            <td className="px-6 py-6">
                                                <span className="text-white font-bold group-hover:text-blue-400 transition-colors uppercase italic tracking-tight">
                                                    {event.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest">
                                                    {event.eventType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded text-[10px] font-bold font-mono">
                                                    {event.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${event.gender === 'MALE'
                                                    ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                                    : 'bg-pink-500/10 border-pink-500/20 text-pink-400'
                                                    }`}>
                                                    {event.gender}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${event.status === 'COMPLETED'
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                    }`}>
                                                    {event.status}
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
                        TournaNet Analytics Engine • Event Lifecycle Monitor
                    </p>
                </footer>
            </main>
        </RequireAuth>
    );
}
