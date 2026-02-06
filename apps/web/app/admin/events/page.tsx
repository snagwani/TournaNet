"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../app/context/AuthContext';
import { useTimezone } from '@/app/context/TimezoneContext';
import { formatTournamentTime, TOURNAMENT_TIMEZONE } from '@/lib/timeUtils';
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import BulkImportModal from '@/components/admin/BulkImportModal';

interface Event {
    id: string;
    name: string;
    eventType: 'TRACK' | 'FIELD';
    gender: 'MALE' | 'FEMALE';
    category: string;
    date: string;
    startTime: string;
    venue?: string;
    heats?: { id: string; heatNumber: number }[];
}

export default function EventsManagementPage() {
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const { timezone } = useTimezone();
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isResultsImportModalOpen, setIsResultsImportModalOpen] = useState(false);


    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3001/api/events', {
                credentials: 'include'
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to fetch events');
            }

            const data = await response.json();
            setEvents(data || []);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        fetchEvents();
    }, [user, fetchEvents]);

    const getEventStatus = (event: Event) => {
        // Use Tournament Time for status calculation to stay consistent
        const now = new Date();
        const eventStart = fromZonedTime(`${event.date.split('T')[0]} ${event.startTime}:00`, TOURNAMENT_TIMEZONE);

        // Simple heuristic: if it started more than 2 hours ago, assume completed if no heats in progress
        // Actually, let's just stick to the day logic for now but make it timezone-aware
        const todayStr = formatInTimeZone(now, TOURNAMENT_TIMEZONE, 'yyyy-MM-dd');
        const eventDateStr = event.date.split('T')[0];

        if (eventDateStr < todayStr) return 'COMPLETED';
        if (eventDateStr === todayStr) return 'IN_PROGRESS';
        return 'UPCOMING';
    };

    const canGenerateHeats = (event: Event) => {
        return event.eventType === 'TRACK' && (!event.heats || event.heats.length === 0);
    };

    return (
        <main className="p-8 space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-800 pb-6 gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                        Event Management
                    </h1>
                    <p className="text-neutral-500 text-sm font-mono uppercase tracking-widest">
                        Configure Events • Generate Heats • Monitor Progress
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-[10px] font-bold text-neutral-400 uppercase tracking-widest hover:text-white hover:border-neutral-700 transition-all flex items-center gap-2"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Import CSV
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                const response = await fetch('http://localhost:3001/api/admin/export?type=events&format=csv', {
                                    credentials: 'include'
                                });
                                if (!response.ok) throw new Error('Export failed');
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `events-report-${new Date().toISOString().split('T')[0]}.csv`;
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                            } catch (err) {
                                alert('Failed to export CSV');
                            }
                        }}
                        className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-[10px] font-bold text-neutral-400 uppercase tracking-widest hover:text-white hover:border-neutral-700 transition-all flex items-center gap-2"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export CSV
                    </button>
                    {error && (
                        <button
                            onClick={fetchEvents}
                            className="text-[10px] text-red-400 hover:text-white uppercase tracking-widest font-bold flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20 transition-all hover:bg-red-500/20"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Retry
                        </button>
                    )}
                    <button
                        onClick={() => router.push('/admin/events/create')}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Event
                    </button>
                    <button
                        onClick={() => setIsResultsImportModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Import Results
                    </button>
                </div>
            </header>

            <BulkImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Bulk Import Events"
                entityName="Events"
                endpoint="http://localhost:3001/api/events/bulk-import"
                onSuccess={fetchEvents}
                templateHeaders="name, eventType, gender, category, date, startTime, venue"
                sampleData="100m Sprint, TRACK, MALE, U17, 2026-02-15, 09:00, Main Stadium"
            />

            <BulkImportModal
                isOpen={isResultsImportModalOpen}
                onClose={() => setIsResultsImportModalOpen(false)}
                title="Bulk Import Results"
                entityName="Results"
                endpoint="http://localhost:3001/api/results/bulk-import"
                onSuccess={fetchEvents}
                templateHeaders="event, bib, status, resultValue, notes"
                sampleData="100m Sprint, MUM-SMA-001, FINISHED, 10.45s, Heat 1"
            />

            <section className="bg-neutral-900/30 border border-neutral-800 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-900/50 border-b border-neutral-800">
                                <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500">Event Info</th>
                                <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">Date & Time</th>
                                <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">Category/Gender</th>
                                <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">Heats</th>
                                <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">Status</th>
                                <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-right">Actions</th>
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
                                            <div className="h-5 w-24 bg-neutral-800 animate-pulse rounded-full mx-auto" />
                                        </td>
                                        <td className="px-6 py-8">
                                            <div className="flex justify-center gap-2">
                                                <div className="h-5 w-10 bg-neutral-800 animate-pulse rounded" />
                                                <div className="h-5 w-16 bg-neutral-800 animate-pulse rounded" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-8">
                                            <div className="h-5 w-16 bg-neutral-800 animate-pulse rounded-full mx-auto" />
                                        </td>
                                        <td className="px-6 py-8">
                                            <div className="h-5 w-24 bg-neutral-800 animate-pulse rounded-full mx-auto" />
                                        </td>
                                        <td className="px-6 py-8">
                                            <div className="h-8 w-24 bg-neutral-800 animate-pulse rounded-xl ml-auto" />
                                        </td>
                                    </tr>
                                ))
                            ) : events.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center space-y-4">
                                            <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-3xl flex items-center justify-center">
                                                <svg className="w-8 h-8 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-white font-bold text-lg">No Events Created Yet</p>
                                                <p className="text-neutral-500 text-sm">Click "Create Event" to add your first tournament event.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                events.map((event) => {
                                    const status = getEventStatus(event);
                                    return (
                                        <tr
                                            key={event.id}
                                            className="border-b border-neutral-800/50 hover:bg-white/[0.04] transition-all group"
                                        >
                                            <td className="px-6 py-8">
                                                <div className="space-y-1">
                                                    <span className="text-lg font-black text-white group-hover:text-blue-400 transition-colors uppercase italic tracking-tighter block">
                                                        {event.name}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black font-mono border ${event.eventType === 'TRACK'
                                                            ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                                                            : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                            }`}>
                                                            {event.eventType}
                                                        </span>
                                                        {event.venue && (
                                                            <span className="text-[9px] text-neutral-600 font-mono">📍 {event.venue}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8 text-center">
                                                <div className="space-y-1">
                                                    <p className="text-neutral-400 font-mono text-[11px] font-bold">
                                                        {formatInTimeZone(new Date(event.date), timezone, 'yyyy-MM-dd')}
                                                    </p>
                                                    <p className="text-neutral-600 font-mono text-[10px]">
                                                        {(() => {
                                                            const d = fromZonedTime(`${event.date.split('T')[0]} ${event.startTime}:00`, TOURNAMENT_TIMEZONE);
                                                            return formatTournamentTime(d, 'HH:mm', timezone);
                                                        })()} {timezone === TOURNAMENT_TIMEZONE ? 'IST' : ''}
                                                    </p>
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
                                            <td className="px-6 py-8 text-center">
                                                {event.heats && event.heats.length > 0 ? (
                                                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold">
                                                        {event.heats.length} Heat{event.heats.length !== 1 ? 's' : ''}
                                                    </span>
                                                ) : (
                                                    <span className="text-neutral-600 text-[10px] font-mono">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-8 text-center">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${status === 'COMPLETED'
                                                    ? 'bg-neutral-500/10 border-neutral-500/20 text-neutral-400'
                                                    : status === 'IN_PROGRESS'
                                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                    }`}>
                                                    {status === 'IN_PROGRESS' ? 'LIVE' : status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-8 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {canGenerateHeats(event) && (
                                                        <button
                                                            onClick={() => router.push(`/admin/events/${event.id}?action=generate-heats`)}
                                                            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-sm"
                                                        >
                                                            Generate Heats
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => router.push(`/admin/events/${event.id}`)}
                                                        className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                                    >
                                                        View Details
                                                    </button>
                                                </div>
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
                <p className="text-[10px] text-neutral-700 uppercase tracking-[0.3em] font-medium">
                    TournaNet Event Management • Build 2026.02.04
                </p>
            </footer>
        </main>
    );
}
