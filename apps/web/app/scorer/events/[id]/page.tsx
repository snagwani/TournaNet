"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Heat {
    id: string;
    heatNumber: number;
    results: any[];
    lanes: {
        id: string;
        laneNumber: number;
        athlete: {
            name: string;
            bibNumber: string;
            school: { name: string };
        };
    }[];
}

interface Event {
    id: string;
    name: string;
    eventType: 'TRACK' | 'FIELD';
    category: string;
    gender: string;
    date: string;
    startTime: string;
    delayReason?: string | null;
    heats: Heat[];
}

export default function EventHeatsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [event, setEvent] = useState<Event | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [newTime, setNewTime] = useState('');
    const [delayReason, setDelayReason] = useState('');

    const fetchEvent = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:3001/api/events/${id}`, {
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to fetch event details');
            const data = await response.json();
            setEvent(data);
            setNewTime(data.startTime);
            setDelayReason(data.delayReason || '');
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvent();
    }, [id]);

    const handleReschedule = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/events/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startTime: newTime,
                    delayReason: delayReason || null
                }),
                credentials: 'include'
            });

            if (response.ok) {
                setIsRescheduling(false);
                fetchEvent();
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to reschedule');
            }
        } catch (err) {
            alert('An error occurred during rescheduling');
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 space-y-4">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-neutral-500 font-mono text-[10px] uppercase tracking-[0.3em]">Loading Event Heats...</p>
            </div>
        );
    }

    if (!event) return null;

    return (
        <main className="max-w-7xl mx-auto p-8 space-y-8">
            <header className="space-y-6">
                <Link
                    href="/scorer"
                    className="inline-flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                >
                    ← Back to Dashboard
                </Link>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-800 pb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border ${event.eventType === 'TRACK' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                                {event.eventType}
                            </span>
                            <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
                                {event.category} • {event.gender}
                            </span>
                        </div>
                        <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter">
                            {event.name}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl px-6 py-4 text-right">
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Scheduled Time</p>
                            {isRescheduling ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="time"
                                            value={newTime}
                                            onChange={(e) => setNewTime(e.target.value)}
                                            className="bg-neutral-800 border border-neutral-700 text-white rounded px-2 py-1 text-xl font-black italic"
                                        />
                                    </div>
                                    <textarea
                                        value={delayReason}
                                        onChange={(e) => setDelayReason(e.target.value)}
                                        placeholder="Reason for delay (e.g., Heavy rain, Lightning)"
                                        className="w-full bg-neutral-800 border border-neutral-700 text-white rounded px-3 py-2 text-xs placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500"
                                        rows={2}
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={handleReschedule} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors">Save</button>
                                        <button onClick={() => setIsRescheduling(false)} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded-lg text-xs font-bold transition-colors">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <p className="text-2xl font-black text-white italic">{event.startTime}</p>
                                    <button
                                        onClick={() => setIsRescheduling(true)}
                                        className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-500 hover:text-emerald-500"
                                        title="Reschedule for Weather/Delay"
                                    >
                                        🕒
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Delay Banner */}
                {event.delayReason && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex items-start gap-4">
                        <div className="text-3xl">⚠️</div>
                        <div className="flex-1">
                            <p className="text-amber-400 font-bold text-sm uppercase tracking-widest mb-1">Event Delayed</p>
                            <p className="text-neutral-300 text-sm">{event.delayReason}</p>
                        </div>
                    </div>
                )}
            </header>

            <section className="space-y-6">
                <h2 className="text-xs font-mono uppercase tracking-[0.3em] text-neutral-500">Heats Configuration</h2>

                {event.heats.length === 0 ? (
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-12 text-center text-neutral-500">
                        <p className="text-sm">No heats generated for this event yet.</p>
                        <p className="text-[10px] uppercase font-mono mt-2">Contact administrator to generate heats</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {event.heats.map((heat) => (
                            <div key={heat.id} className="bg-neutral-900/40 border border-neutral-800 rounded-[2.5rem] overflow-hidden hover:border-neutral-700 transition-all group flex flex-col">
                                <div className="p-8 space-y-6 flex-grow">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Competition</p>
                                            <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">Heat #{heat.heatNumber}</h3>
                                        </div>
                                        <div className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${heat.results.length > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                                            {heat.results.length > 0 ? '✅ Completed' : '📡 Ready to Score'}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Assigned Athletes</p>
                                        <div className="bg-black/20 rounded-2xl p-4 space-y-2">
                                            {heat.lanes.map(lane => (
                                                <div key={lane.id} className="flex items-center justify-between text-xs">
                                                    <span className="text-neutral-500 font-mono">Lane {lane.laneNumber}</span>
                                                    <span className="text-white font-bold">{lane.athlete.name}</span>
                                                </div>
                                            ))}
                                            {heat.lanes.length === 0 && <p className="text-neutral-700 text-[10px] italic">No athletes assigned</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-neutral-950/50 border-t border-neutral-800">
                                    <Link
                                        href={`/scorer/events/${event.id}/heats/${heat.id}`}
                                        className="block w-full text-center py-4 bg-white text-black hover:bg-neutral-200 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                                    >
                                        {heat.results.length > 0 ? 'Review Results' : 'Launch Scoring Terminal'}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
