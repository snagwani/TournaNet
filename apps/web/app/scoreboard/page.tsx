"use client";

import React, { useState, useEffect, useCallback } from 'react';

type TabType = 'current' | 'upcoming' | 'results' | 'tally' | 'search';

interface ScoreboardResult {
    athleteId: string;
    bibNumber: number;
    athleteName: string;
    schoolName: string;
    resultValue: string | null;
    status: string | null;
    rank: number | null;
}

interface ScoreboardEvent {
    eventId: string;
    name: string;
    eventType: 'TRACK' | 'FIELD';
    category: string;
    gender: string;
    status: string;
    heatNumber: number | null;
    liveResults: ScoreboardResult[];
}

interface ScoreboardUpcomingEvent {
    eventId: string;
    name: string;
    eventType: 'TRACK' | 'FIELD';
    startTime: string;
    venue: string | null;
    category: string;
    gender: string;
}

export default function ScoreboardPage() {
    const [activeTab, setActiveTab] = useState<TabType>('current');
    const [liveEvents, setLiveEvents] = useState<ScoreboardEvent[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<ScoreboardUpcomingEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const tabs = [
        { id: 'current', label: 'Current Events', icon: '⚡' },
        { id: 'upcoming', label: 'Upcoming', icon: '📅' },
        { id: 'results', label: 'Results', icon: '🏆' },
        { id: 'tally', label: 'Medal Tally', icon: '📊' },
        { id: 'search', label: 'Athlete Search', icon: '🔍' },
    ];

    const fetchLiveEvents = useCallback(async (isSilent = false) => {
        if (!isSilent) setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3001/api/scoreboard/current');
            if (!response.ok) throw new Error('Failed to fetch live events');
            const data = await response.json();
            setLiveEvents(data.events || []);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            if (!isSilent) setIsLoading(false);
        }
    }, []);

    const fetchUpcomingEvents = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3001/api/scoreboard/upcoming?windowMinutes=240');
            if (!response.ok) throw new Error('Failed to fetch upcoming events');
            const data = await response.json();
            // Backend already sorts by date/time, but we'll ensure it here too
            const sorted = (data.events || []).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
            setUpcomingEvents(sorted);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'current') {
            fetchLiveEvents();
            const interval = setInterval(() => fetchLiveEvents(true), 30000);
            return () => clearInterval(interval);
        } else if (activeTab === 'upcoming') {
            fetchUpcomingEvents();
        }
    }, [activeTab, fetchLiveEvents, fetchUpcomingEvents]);

    const renderCurrentEvents = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-neutral-500 font-mono text-[10px] uppercase tracking-[0.3em]">Synchronizing Live Feed...</p>
                </div>
            );
        }

        if (liveEvents.length === 0) {
            return (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-12 text-center">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                            <span className="text-2xl">⚡</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Live Events</h3>
                        <p className="text-neutral-500 max-w-sm mx-auto">
                            There are no track or field events currently in progress.
                            Check the <button onClick={() => setActiveTab('upcoming')} className="text-blue-400 hover:underline">Upcoming</button> tab for the full schedule.
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {liveEvents.map((event) => (
                    <article key={event.eventId} className="space-y-6">
                        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border ${event.eventType === 'TRACK' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                                        {event.eventType}
                                    </span>
                                    <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
                                        {event.category} • {event.gender}
                                    </span>
                                </div>
                                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                                    {event.name}
                                </h2>
                            </div>
                            <div className="flex items-center gap-4">
                                {event.heatNumber && (
                                    <div className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl">
                                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest leading-none mb-1">Heat</p>
                                        <p className="text-xl font-black italic text-white leading-none">#{event.heatNumber}</p>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Live</p>
                                </div>
                            </div>
                        </header>

                        <div className="bg-neutral-900/30 border border-neutral-800 rounded-[2rem] overflow-hidden backdrop-blur-sm shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-neutral-900/50 border-b border-neutral-800">
                                            <th className="px-6 py-5 text-[10px] font-mono uppercase tracking-widest text-neutral-500">Rank</th>
                                            <th className="px-6 py-5 text-[10px] font-mono uppercase tracking-widest text-neutral-500">Bib</th>
                                            <th className="px-6 py-5 text-[10px] font-mono uppercase tracking-widest text-neutral-500">Athlete</th>
                                            <th className="px-6 py-5 text-[10px] font-mono uppercase tracking-widest text-neutral-500">School</th>
                                            <th className="px-6 py-5 text-[10px] font-mono uppercase tracking-widest text-neutral-500 text-right">Result</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {event.liveResults.map((result) => (
                                            <tr key={result.athleteId} className="border-b border-neutral-800/50 hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-5">
                                                    {result.rank ? (
                                                        <span className={`
                                                            flex items-center justify-center w-8 h-8 rounded-lg font-black italic text-sm
                                                            ${result.rank === 1 ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' :
                                                                result.rank === 2 ? 'bg-neutral-400 text-black' :
                                                                    result.rank === 3 ? 'bg-amber-600 text-black' :
                                                                        'text-neutral-500'}
                                                        `}>
                                                            {result.rank}
                                                        </span>
                                                    ) : (
                                                        <span className="text-neutral-700 font-mono text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-[10px] font-mono text-neutral-400">
                                                        #{result.bibNumber}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-sm font-bold text-white capitalize">{result.athleteName}</span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-xs text-neutral-500 capitalize">{result.schoolName}</span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <span className="text-lg font-black text-white italic tracking-tighter">
                                                        {result.resultValue || (result.status ? <span className="text-xs text-neutral-500 uppercase not-italic font-bold">{result.status}</span> : '—')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        );
    };

    const renderUpcomingEvents = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse space-y-4">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-neutral-500 font-mono text-[10px] uppercase tracking-[0.3em]">Fetching Schedule...</p>
                </div>
            );
        }

        if (upcomingEvents.length === 0) {
            return (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-12 text-center">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                            <span className="text-2xl">📅</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Upcoming Events</h3>
                        <p className="text-neutral-500 max-w-sm mx-auto">
                            There are no more events scheduled for the current session window.
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {upcomingEvents.map((event) => (
                    <article key={event.eventId} className="bg-neutral-900/40 border border-neutral-800 p-6 rounded-[2rem] hover:bg-neutral-900/60 transition-all group">
                        <div className="flex justify-between items-start gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border ${event.eventType === 'TRACK' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                                        {event.eventType}
                                    </span>
                                    <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
                                        {event.category} • {event.gender}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase italic group-hover:text-emerald-400 transition-colors">
                                    {event.name}
                                </h3>
                                {event.venue && (
                                    <div className="flex items-center gap-2 text-neutral-500">
                                        <span className="text-xs">📍</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{event.venue}</span>
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Starts At</p>
                                <p className="text-2xl font-black italic text-white tracking-tight">{event.startTime}</p>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'current':
                return renderCurrentEvents();
            case 'upcoming':
                return renderUpcomingEvents();
            case 'results':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-12 text-center">
                            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
                                <span className="text-2xl">🏆</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Hall of Fame</h3>
                            <p className="text-neutral-500 max-w-sm mx-auto">
                                Final standings and verified results for completed events will be archived here.
                            </p>
                        </div>
                    </div>
                );
            case 'tally':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-12 text-center">
                            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
                                <span className="text-2xl">📊</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">School Standings</h3>
                            <p className="text-neutral-500 max-w-sm mx-auto">
                                Overall points and medal counts for all participating schools.
                            </p>
                        </div>
                    </div>
                );
            case 'search':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by name or bib number..."
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-12 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">🔍</span>
                        </div>
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-12 text-center">
                            <p className="text-neutral-500">Start typing to find athletes and view their performance history.</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
            {/* Immersive Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
            </div>

            <div className="relative max-w-6xl mx-auto px-4 py-8 md:py-16">
                {/* Header */}
                <header className="mb-12 text-center space-y-4">
                    <div className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full mb-2">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em]">
                            Official Tournament Hub
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase italic flex flex-col items-center">
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-500">
                            Live Athletics
                        </span>
                        <span className="text-blue-500 -mt-2">Scoreboard</span>
                    </h1>
                </header>

                {/* Tab Navigation */}
                <nav className="flex flex-wrap justify-center gap-2 mb-12 p-1.5 bg-neutral-900/50 border border-neutral-800 rounded-[2rem] md:rounded-full overflow-hidden backdrop-blur-xl">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`
                                flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300
                                ${activeTab === tab.id
                                    ? 'bg-white text-black shadow-xl scale-105'
                                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                                }
                            `}
                        >
                            <span className="hidden sm:inline">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* Main Content */}
                <main className="min-h-[400px]">
                    {renderContent()}
                </main>

                {/* Footer */}
                <footer className="mt-24 pt-8 border-t border-neutral-900 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-600 uppercase tracking-[0.3em]">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Secure Real-time Data Sync Active
                        </div>
                        <p className="text-[10px] text-neutral-800 uppercase tracking-widest">
                            TournaNet Spectator Client • v2.1.0-Spectate
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
