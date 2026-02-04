"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../app/context/AuthContext';

interface HeatLane {
    laneNumber: number;
    athlete: {
        name: string;
        bibNumber: string;
        personalBest: string | null;
    };
}

interface Heat {
    id: string;
    heatNumber: number;
    lanes: HeatLane[];
}

interface EventDetail {
    id: string;
    name: string;
    eventType: 'TRACK' | 'FIELD';
    gender: 'MALE' | 'FEMALE';
    category: string;
    date: string;
    startTime: string;
    venue?: string;
    rules: any;
    heats?: Heat[];
}

export default function EventDetailPage() {
    const { eventId } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();

    const [event, setEvent] = useState<EventDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [seedingStrategy, setSeedingStrategy] = useState<'PB_ASC' | 'RANDOM'>('PB_ASC');
    const [isGenerating, setIsGenerating] = useState(false);

    const fetchEventDetail = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:3001/api/events/${eventId}`, {
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

            // Check if we should auto-open the generate modal
            if (searchParams?.get('action') === 'generate-heats' && data.eventType === 'TRACK' && (!data.heats || data.heats.length === 0)) {
                setShowGenerateModal(true);
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [eventId, searchParams]);

    useEffect(() => {
        if (!user || !eventId) {
            setIsLoading(false);
            return;
        }
        fetchEventDetail();
    }, [user, eventId, fetchEventDetail]);

    const handleGenerateHeats = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:3001/api/events/${eventId}/heats/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ seedingStrategy })
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to generate heats');
            }

            // Refresh event data to show generated heats
            await fetchEventDetail();
            setShowGenerateModal(false);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-neutral-500">Please log in to access this page.</p>
            </div>
        );
    }

    return (
        <>
            {isLoading ? (
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                        <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest animate-pulse">
                            Loading Event Data...
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
                            <h2 className="text-white font-black text-2xl uppercase italic tracking-tight">Error</h2>
                            <p className="text-neutral-500 mt-2">{error || 'Event data could not be retrieved.'}</p>
                        </div>
                        <button
                            onClick={() => router.push('/admin/events')}
                            className="w-full py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-2xl transition-all uppercase text-xs tracking-widest"
                        >
                            Back to Events
                        </button>
                    </div>
                </div>
            ) : (
                <main className="p-8 space-y-8">
                    {/* Header */}
                    <header className="border-b border-neutral-800 pb-6">
                        <button
                            onClick={() => router.push('/admin/events')}
                            className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors group mb-4"
                        >
                            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span className="text-[10px] font-black uppercase tracking-widest">Back to Events</span>
                        </button>

                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
                                    {event.name}
                                </h1>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black font-mono border ${event.eventType === 'TRACK'
                                        ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                                        : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                        }`}>
                                        {event.eventType}
                                    </span>
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
                            </div>

                            {event.eventType === 'TRACK' && (!event.heats || event.heats.length === 0) && (
                                <button
                                    onClick={() => setShowGenerateModal(true)}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                                >
                                    Generate Heats
                                </button>
                            )}
                        </div>
                    </header>

                    {/* Event Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 space-y-4">
                            <h2 className="text-lg font-black text-white uppercase tracking-tight">Schedule</h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Date</p>
                                    <p className="text-white font-mono">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Start Time</p>
                                    <p className="text-white font-mono">{event.startTime}</p>
                                </div>
                                {event.venue && (
                                    <div>
                                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Venue</p>
                                        <p className="text-white">{event.venue}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 space-y-4">
                            <h2 className="text-lg font-black text-white uppercase tracking-tight">Rules</h2>
                            <div className="space-y-2">
                                {event.eventType === 'TRACK' ? (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-neutral-500 text-sm">Max Athletes Per Heat:</span>
                                            <span className="text-white font-bold">{event.rules.maxAthletesPerHeat}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-neutral-500 text-sm">Qualification Rule:</span>
                                            <span className="text-white font-bold">{event.rules.qualificationRule?.replace(/_/g, ' ')}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-neutral-500 text-sm">Max Athletes Per Flight:</span>
                                            <span className="text-white font-bold">{event.rules.maxAthletesPerFlight}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-neutral-500 text-sm">Attempts:</span>
                                            <span className="text-white font-bold">{event.rules.attempts}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-neutral-500 text-sm">Finalists:</span>
                                            <span className="text-white font-bold">{event.rules.finalists}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Heats Section */}
                    {event.heats && event.heats.length > 0 && (
                        <section className="space-y-4">
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                                Generated Heats ({event.heats.length})
                            </h2>
                            <div className="grid grid-cols-1 gap-6">
                                {event.heats.map((heat) => (
                                    <div key={heat.id} className="bg-neutral-900/30 border border-neutral-800 rounded-3xl overflow-hidden">
                                        <div className="bg-neutral-900/50 px-6 py-4 border-b border-neutral-800">
                                            <h3 className="text-lg font-black text-white uppercase">Heat {heat.heatNumber}</h3>
                                        </div>
                                        <div className="p-6">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-neutral-800">
                                                        <th className="px-4 py-3 text-left text-[10px] font-black text-neutral-500 uppercase tracking-widest">Lane</th>
                                                        <th className="px-4 py-3 text-left text-[10px] font-black text-neutral-500 uppercase tracking-widest">Athlete</th>
                                                        <th className="px-4 py-3 text-left text-[10px] font-black text-neutral-500 uppercase tracking-widest">Bib</th>
                                                        <th className="px-4 py-3 text-left text-[10px] font-black text-neutral-500 uppercase tracking-widest">Personal Best</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {heat.lanes.map((lane) => (
                                                        <tr key={lane.laneNumber} className="border-b border-neutral-800/50 hover:bg-white/[0.02] transition-colors">
                                                            <td className="px-4 py-4">
                                                                <span className="text-white font-black text-lg">{lane.laneNumber}</span>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <span className="text-white font-bold">{lane.athlete.name}</span>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <span className="text-neutral-500 font-mono text-sm">{lane.athlete.bibNumber}</span>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <span className="text-neutral-400 font-mono text-sm">{lane.athlete.personalBest || '—'}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </main>
            )}

            {/* Generate Heats Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-md w-full space-y-6">
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">Generate Heats</h2>
                            <p className="text-neutral-500 text-sm mt-2">Select a seeding strategy for heat generation</p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                                <p className="text-red-400 text-sm font-bold">{error}</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className={`cursor-pointer border-2 rounded-xl p-4 transition-all block ${seedingStrategy === 'PB_ASC'
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-700'
                                }`}>
                                <input
                                    type="radio"
                                    name="seeding"
                                    value="PB_ASC"
                                    checked={seedingStrategy === 'PB_ASC'}
                                    onChange={(e) => setSeedingStrategy(e.target.value as 'PB_ASC')}
                                    className="sr-only"
                                />
                                <div>
                                    <p className="text-white font-black uppercase text-sm">Personal Best (Ascending)</p>
                                    <p className="text-neutral-500 text-xs mt-1">Seed athletes by their personal best times, fastest first</p>
                                </div>
                            </label>

                            <label className={`cursor-pointer border-2 rounded-xl p-4 transition-all block ${seedingStrategy === 'RANDOM'
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-700'
                                }`}>
                                <input
                                    type="radio"
                                    name="seeding"
                                    value="RANDOM"
                                    checked={seedingStrategy === 'RANDOM'}
                                    onChange={(e) => setSeedingStrategy(e.target.value as 'RANDOM')}
                                    className="sr-only"
                                />
                                <div>
                                    <p className="text-white font-black uppercase text-sm">Random</p>
                                    <p className="text-neutral-500 text-xs mt-1">Randomly assign athletes to heats</p>
                                </div>
                            </label>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowGenerateModal(false);
                                    setError(null);
                                }}
                                disabled={isGenerating}
                                className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl py-3 text-sm font-black uppercase tracking-widest transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerateHeats}
                                disabled={isGenerating}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 text-sm font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
                            >
                                {isGenerating ? 'Generating...' : 'Generate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
