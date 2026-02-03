"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Event {
    id: string;
    name: string;
    eventType: 'TRACK' | 'FIELD';
    category: string;
    gender: string;
    date: string;
    startTime: string;
    venue: string | null;
    heats: {
        id: string;
        heatNumber: number;
        _count: { results: number };
    }[];
}

export default function ScorerDashboard() {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [filter, setFilter] = useState<'today' | 'all'>('today');

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const url = filter === 'today'
                ? `http://localhost:3001/api/events?date=${new Date().toISOString().split('T')[0]}`
                : 'http://localhost:3001/api/events';

            const response = await fetch(url, {
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to fetch events');
            const data = await response.json();
            setEvents(data);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [filter]);

    const getStatusColor = (event: Event) => {
        const totalHeats = event.heats.length;
        const completedHeats = event.heats.filter(h => h._count.results > 0).length;

        if (totalHeats === 0) return 'text-neutral-500';
        if (completedHeats === 0) return 'text-blue-400';
        if (completedHeats < totalHeats) return 'text-amber-400';
        return 'text-emerald-400';
    };

    const getStatusText = (event: Event) => {
        const totalHeats = event.heats.length;
        const completedHeats = event.heats.filter(h => h._count.results > 0).length;

        if (totalHeats === 0) return 'No Heats';
        if (completedHeats === 0) return 'Ready';
        if (completedHeats < totalHeats) return `In Progress (${completedHeats}/${totalHeats})`;
        return 'Completed';
    };

    return (
        <main className="max-w-7xl mx-auto p-8 space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-800 pb-8">
                <div className="space-y-1">
                    <h2 className="text-sm font-mono uppercase tracking-[0.3em] text-neutral-500">
                        Operational Dashboard
                    </h2>
                    <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
                        Scoring Terminal
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl p-1">
                        <button
                            onClick={() => setFilter('today')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${filter === 'today' ? 'bg-emerald-600 text-white' : 'text-neutral-500 hover:text-white'}`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-emerald-600 text-white' : 'text-neutral-500 hover:text-white'}`}
                        >
                            History
                        </button>
                    </div>
                    <button
                        onClick={fetchEvents}
                        className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 transition-colors"
                    >
                        🔄 Refresh
                    </button>
                </div>
            </header>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-neutral-500 font-mono text-[10px] uppercase tracking-[0.3em]">Loading Schedule...</p>
                </div>
            ) : error ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                    <p className="text-red-400 text-sm font-bold">{error}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                        <div key={event.id} className="bg-neutral-900/40 border border-neutral-800 rounded-[2rem] overflow-hidden hover:border-neutral-700 transition-all group flex flex-col">
                            <div className="p-6 space-y-4 flex-grow">
                                <div className="flex items-center justify-between">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border ${event.eventType === 'TRACK' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                                        {event.eventType}
                                    </span>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${getStatusColor(event)}`}>
                                        {getStatusText(event)}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-white uppercase italic leading-tight group-hover:text-emerald-400 transition-colors">
                                        {event.name}
                                    </h3>
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                                        {event.category} • {event.gender}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between text-neutral-400">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs">📅</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{new Date(event.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs">🕒</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{event.startTime}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-neutral-950/50 border-t border-neutral-800">
                                <Link
                                    href={`/scorer/events/${event.id}`}
                                    className="block w-full text-center py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors shadow-[0_0_20px_rgba(5,150,105,0.2)]"
                                >
                                    Open Scorer Space
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
