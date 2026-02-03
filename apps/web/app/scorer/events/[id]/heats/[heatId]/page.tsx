"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Lane {
    id: string;
    laneNumber: number;
    athleteId: string;
    athlete: {
        name: string;
        bibNumber: number;
        school: { name: string };
    };
}

interface Result {
    athleteId: string;
    bibNumber: number;
    status: 'FINISHED' | 'DNS' | 'DNF' | 'DQ';
    resultValue: string;
    notes?: string;
}

export default function ScoringTerminalPage({ params }: { params: Promise<{ id: string; heatId: string }> }) {
    const { id: eventId, heatId } = use(params);
    const router = useRouter();
    const [event, setEvent] = useState<any>(null);
    const [heat, setHeat] = useState<any>(null);
    const [results, setResults] = useState<Record<string, Result>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch event to get context and heat data
                const response = await fetch(`http://localhost:3001/api/events/${eventId}`, {
                    credentials: 'include'
                });
                if (!response.ok) throw new Error('Failed to fetch data');
                const eventData = await response.json();
                setEvent(eventData);

                const currentHeat = eventData.heats.find((h: any) => h.id === heatId);
                if (!currentHeat) throw new Error('Heat not found');
                setHeat(currentHeat);

                // Initialize results state
                const initialResults: Record<string, Result> = {};
                currentHeat.lanes.forEach((lane: Lane) => {
                    const existingRes = currentHeat.results.find((r: any) => r.athleteId === lane.athleteId);
                    initialResults[lane.athleteId] = {
                        athleteId: lane.athleteId,
                        bibNumber: lane.athlete.bibNumber,
                        status: existingRes?.status || 'FINISHED',
                        resultValue: existingRes?.resultValue || '',
                        notes: existingRes?.notes || ''
                    };
                });
                setResults(initialResults);
            } catch (err: any) {
                setError(err.message || 'An unexpected error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [eventId, heatId]);

    const handleResultChange = (athleteId: string, field: keyof Result, value: any) => {
        setResults(prev => ({
            ...prev,
            [athleteId]: {
                ...prev[athleteId],
                [field]: value,
                // If status changes from FINISHED, clear resultValue
                ...(field === 'status' && value !== 'FINISHED' ? { resultValue: '' } : {})
            }
        }));
    };

    const submitResults = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const resultsArray = Object.values(results).map(r => ({
                athleteId: r.athleteId,
                bibNumber: r.bibNumber,
                status: r.status,
                resultValue: r.status === 'FINISHED' ? r.resultValue : null,
                notes: r.notes || null
            }));

            const response = await fetch(`http://localhost:3001/api/events/${eventId}/heats/${heatId}/results`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ results: resultsArray }),
                credentials: 'include'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to submit results');
            }

            router.push(`/scorer/events/${eventId}`);
        } catch (err: any) {
            setError(err.message);
            setIsSubmitting(false);
        }
    };

    const getRankedPreview = () => {
        const finished = Object.values(results)
            .filter(r => r.status === 'FINISHED' && r.resultValue)
            .map(r => ({
                ...r,
                name: heat?.lanes.find((l: any) => l.athleteId === r.athleteId)?.athlete.name,
                parsedValue: parseFloat(r.resultValue.replace(/[^\d.-]/g, '')) || 0
            }));

        return finished.sort((a, b) => {
            if (event?.eventType === 'TRACK') {
                return a.parsedValue - b.parsedValue; // Lower is better
            } else {
                return b.parsedValue - a.parsedValue; // Higher is better
            }
        });
    };

    const rankedPreview = getRankedPreview();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 space-y-4">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                <p className="text-neutral-500 font-mono text-[10px] uppercase tracking-[0.3em]">Opening Terminal...</p>
            </div>
        );
    }

    if (!event || !heat) return null;

    return (
        <main className="max-w-5xl mx-auto p-8 space-y-8 pb-32">
            <header className="space-y-6">
                <Link
                    href={`/scorer/events/${eventId}`}
                    className="inline-flex items-center gap-2 text-neutral-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
                >
                    ← Back to Heats
                </Link>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-neutral-800 pb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                                Scoring Terminal
                            </span>
                            <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
                                {event.name} • Heat #{heat.heatNumber}
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                            Enter Official Results
                        </h1>
                    </div>
                </div>
            </header>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                    <p className="text-red-400 text-sm font-bold">Submission Error: {error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Entry Form */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-neutral-900/50 rounded-2xl border border-neutral-800 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
                        <div className="col-span-1">Lane</div>
                        <div className="col-span-3">Athlete</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Official {event.eventType === 'TRACK' ? 'Time (s)' : 'Mark (m)'}</div>
                        <div className="col-span-4">Notes</div>
                    </div>

                    <div className="space-y-3">
                        {heat.lanes.map((lane: Lane) => {
                            const res = results[lane.athleteId];
                            const isSelected = res.resultValue !== '';

                            return (
                                <div key={lane.id} className={`grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-6 bg-neutral-900/30 border rounded-3xl transition-all ${isSelected ? 'border-emerald-500/30 bg-emerald-500/[0.02]' : 'border-neutral-800'}`}>
                                    <div className="col-span-1">
                                        <div className="w-10 h-10 bg-black rounded-xl border border-neutral-800 flex items-center justify-center text-xl font-black italic text-emerald-500">
                                            {lane.laneNumber}
                                        </div>
                                    </div>

                                    <div className="col-span-3">
                                        <p className="text-sm font-bold text-white uppercase italic">{lane.athlete.name}</p>
                                        <p className="text-[10px] text-neutral-500 font-mono uppercase">Bib #{lane.athlete.bibNumber}</p>
                                    </div>

                                    <div className="col-span-2">
                                        <select
                                            value={res.status}
                                            onChange={(e) => handleResultChange(lane.athleteId, 'status', e.target.value)}
                                            className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 outline-none"
                                        >
                                            <option value="FINISHED">FINISHED</option>
                                            <option value="DNS">DNS</option>
                                            <option value="DNF">DNF</option>
                                            <option value="DQ">DQ</option>
                                        </select>
                                    </div>

                                    <div className="col-span-2">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="0.00"
                                                disabled={res.status !== 'FINISHED'}
                                                value={res.resultValue}
                                                onChange={(e) => handleResultChange(lane.athleteId, 'resultValue', e.target.value)}
                                                className={`w-full bg-black border border-neutral-800 rounded-xl pl-4 pr-10 py-3 text-2xl font-black italic text-white focus:border-emerald-500 outline-none placeholder:text-neutral-800 ${res.status !== 'FINISHED' ? 'opacity-20' : ''}`}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-600 uppercase">
                                                {event.eventType === 'TRACK' ? 's' : 'm'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="col-span-4">
                                        <input
                                            type="text"
                                            placeholder="Notes..."
                                            value={res.notes}
                                            onChange={(e) => handleResultChange(lane.athleteId, 'notes', e.target.value)}
                                            className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-400 focus:border-emerald-500 outline-none"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Rank Preview Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 sticky top-28">
                        <h2 className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-6">Live Rank Preview</h2>

                        {rankedPreview.length === 0 ? (
                            <div className="py-8 text-center text-neutral-600 text-xs italic">
                                Enter scores to see rankings
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {rankedPreview.map((r, idx) => (
                                    <div key={r.athleteId} className="flex items-center gap-4 group">
                                        <span className={`flex items-center justify-center w-8 h-8 rounded-lg font-black italic text-sm ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-neutral-400 text-black' : idx === 2 ? 'bg-amber-600 text-black' : 'bg-neutral-800 text-neutral-500'}`}>
                                            {idx + 1}
                                        </span>
                                        <div className="flex-grow min-w-0">
                                            <p className="text-xs font-bold text-white uppercase italic truncate">{r.name}</p>
                                            <p className="text-[10px] font-black text-emerald-500 tabular-nums">
                                                {r.resultValue}{event.eventType === 'TRACK' ? 's' : 'm'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/90 to-transparent z-40">
                <div className="max-w-5xl mx-auto flex items-center justify-between bg-neutral-900 border border-neutral-800 p-6 rounded-[2.5rem] shadow-2xl">
                    <div className="hidden md:block">
                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                            {event.eventType} Event Monitoring
                        </p>
                        <p className="text-[10px] text-neutral-600 font-mono">
                            Pressing submit will finalize rankings for this heat.
                        </p>
                    </div>
                    <button
                        onClick={submitResults}
                        disabled={isSubmitting}
                        className="w-full md:w-auto px-12 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(5,150,105,0.3)] flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                Synchronizing...
                            </>
                        ) : 'Transmit Results'}
                    </button>
                </div>
            </div>
        </main>
    );
}
