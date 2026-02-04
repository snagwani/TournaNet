"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../app/context/AuthContext';

interface Conflict {
    type: 'LUNCH_VIOLATION' | 'ATHLETE_CONFLICT' | 'REST_VIOLATION';
    description: string;
    affectedAthleteIds: string[];
}

interface ScheduledEvent {
    eventId: string;
    name: string;
    eventType: 'TRACK' | 'FIELD';
    startTime: string;
    endTime: string;
    venue?: string;
    conflicts: Conflict[];
}

interface ScheduleDay {
    date: string;
    events: ScheduledEvent[];
}

interface ScheduleResponse {
    days: ScheduleDay[];
}

export default function SchedulePage() {
    const router = useRouter();
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        startDate: '',
        days: 2,
        trackGapMinutes: 15,
        athleteRestMinutes: 60
    });

    const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState(0);
    const [conflictFilter, setConflictFilter] = useState<string>('ALL');

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsGenerating(true);

        try {
            const response = await fetch('http://localhost:3001/api/schedule/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to generate schedule');
            }

            const data = await response.json();
            setSchedule(data);
            setSelectedDay(0);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsGenerating(false);
        }
    };

    const getConflictStats = () => {
        if (!schedule) return { total: 0, lunch: 0, athlete: 0, rest: 0 };

        let total = 0, lunch = 0, athlete = 0, rest = 0;

        schedule.days.forEach(day => {
            day.events.forEach(event => {
                event.conflicts.forEach(conflict => {
                    total++;
                    if (conflict.type === 'LUNCH_VIOLATION') lunch++;
                    if (conflict.type === 'ATHLETE_CONFLICT') athlete++;
                    if (conflict.type === 'REST_VIOLATION') rest++;
                });
            });
        });

        return { total, lunch, athlete, rest };
    };

    const getFilteredEvents = (events: ScheduledEvent[]) => {
        if (conflictFilter === 'ALL') return events;
        return events.filter(event =>
            event.conflicts.some(c => c.type === conflictFilter)
        );
    };

    const timeToMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const getEventPosition = (startTime: string, endTime: string) => {
        const dayStart = 8 * 60; // 08:00
        const dayEnd = 17 * 60; // 17:00
        const totalMinutes = dayEnd - dayStart;

        const start = timeToMinutes(startTime);
        const end = timeToMinutes(endTime);

        const top = ((start - dayStart) / totalMinutes) * 100;
        const height = ((end - start) / totalMinutes) * 100;

        return { top: `${top}%`, height: `${height}%` };
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-neutral-500">Please log in to access this page.</p>
            </div>
        );
    }

    const stats = getConflictStats();

    return (
        <main className="p-8 space-y-8">
            <header className="border-b border-neutral-800 pb-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                        Tournament Schedule
                    </h1>
                    <p className="text-neutral-500 text-sm font-mono uppercase tracking-widest">
                        Generate 2-Day Timetable • Manage Conflicts • Optimize Flow
                    </p>
                </div>
            </header>

            {/* Generation Form */}
            <section className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6">
                <h2 className="text-lg font-black text-white uppercase tracking-tight mb-4">
                    Schedule Parameters
                </h2>

                <form onSubmit={handleGenerate} className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                                Start Date *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                                Days
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="3"
                                value={formData.days}
                                onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) })}
                                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                                Track Gap (min)
                            </label>
                            <input
                                type="number"
                                min="10"
                                max="30"
                                value={formData.trackGapMinutes}
                                onChange={(e) => setFormData({ ...formData, trackGapMinutes: parseInt(e.target.value) })}
                                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                                Athlete Rest (min)
                            </label>
                            <input
                                type="number"
                                min="30"
                                max="120"
                                value={formData.athleteRestMinutes}
                                onChange={(e) => setFormData({ ...formData, athleteRestMinutes: parseInt(e.target.value) })}
                                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isGenerating}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                        {isGenerating ? 'Generating Schedule...' : 'Generate Schedule'}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                        <p className="text-red-400 text-sm font-bold">{error}</p>
                    </div>
                )}
            </section>

            {/* Schedule Display */}
            {schedule && (
                <>
                    {/* Conflict Summary */}
                    {stats.total > 0 && (
                        <section className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-lg font-black text-amber-400 uppercase tracking-tight mb-2">
                                        ⚠️ {stats.total} Conflict{stats.total !== 1 ? 's' : ''} Detected
                                    </h2>
                                    <div className="flex gap-4 text-sm">
                                        <span className="text-neutral-400">
                                            <span className="font-bold text-red-400">{stats.lunch}</span> Lunch Violations
                                        </span>
                                        <span className="text-neutral-400">
                                            <span className="font-bold text-orange-400">{stats.athlete}</span> Athlete Conflicts
                                        </span>
                                        <span className="text-neutral-400">
                                            <span className="font-bold text-yellow-400">{stats.rest}</span> Rest Violations
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setConflictFilter('ALL')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${conflictFilter === 'ALL'
                                                ? 'bg-amber-500 text-black'
                                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                                            }`}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setConflictFilter('LUNCH_VIOLATION')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${conflictFilter === 'LUNCH_VIOLATION'
                                                ? 'bg-red-500 text-white'
                                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                                            }`}
                                    >
                                        Lunch
                                    </button>
                                    <button
                                        onClick={() => setConflictFilter('ATHLETE_CONFLICT')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${conflictFilter === 'ATHLETE_CONFLICT'
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                                            }`}
                                    >
                                        Athlete
                                    </button>
                                    <button
                                        onClick={() => setConflictFilter('REST_VIOLATION')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${conflictFilter === 'REST_VIOLATION'
                                                ? 'bg-yellow-500 text-black'
                                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                                            }`}
                                    >
                                        Rest
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Day Tabs */}
                    <div className="flex gap-2">
                        {schedule.days.map((day, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedDay(index)}
                                className={`px-6 py-3 rounded-xl text-sm font-black uppercase tracking-tight transition-all ${selectedDay === index
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'
                                    }`}
                            >
                                Day {index + 1}
                                <span className="ml-2 text-xs opacity-70">
                                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Timeline View */}
                    <section className="bg-neutral-900/30 border border-neutral-800 rounded-3xl overflow-hidden">
                        <div className="p-6 border-b border-neutral-800 bg-neutral-900/50">
                            <h2 className="text-lg font-black text-white uppercase tracking-tight">
                                {new Date(schedule.days[selectedDay].date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </h2>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-[80px_1fr_1fr] gap-4">
                                {/* Time Labels */}
                                <div className="relative h-[600px]">
                                    {Array.from({ length: 10 }, (_, i) => i + 8).map(hour => (
                                        <div
                                            key={hour}
                                            className="absolute text-xs font-mono text-neutral-600 -translate-y-2"
                                            style={{ top: `${((hour - 8) / 9) * 100}%` }}
                                        >
                                            {hour.toString().padStart(2, '0')}:00
                                        </div>
                                    ))}
                                </div>

                                {/* Track Events Column */}
                                <div className="relative h-[600px] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
                                    <div className="absolute top-0 left-0 right-0 p-3 bg-orange-500/10 border-b border-orange-500/20">
                                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest text-center">
                                            Track Events
                                        </p>
                                    </div>

                                    {/* Lunch Break */}
                                    <div
                                        className="absolute left-0 right-0 bg-neutral-800/50 border-y border-neutral-700"
                                        style={{ top: '55.56%', height: '11.11%' }}
                                    >
                                        <p className="text-center text-[10px] font-black text-neutral-600 uppercase mt-2">
                                            Lunch Break
                                        </p>
                                    </div>

                                    {/* Track Events */}
                                    {getFilteredEvents(schedule.days[selectedDay].events)
                                        .filter(event => event.eventType === 'TRACK')
                                        .map((event, idx) => {
                                            const pos = getEventPosition(event.startTime, event.endTime);
                                            return (
                                                <div
                                                    key={idx}
                                                    className="absolute left-2 right-2 bg-orange-600 border border-orange-500 rounded-xl p-3 overflow-hidden hover:z-10 hover:shadow-lg transition-all cursor-pointer"
                                                    style={{ top: pos.top, height: pos.height, minHeight: '60px' }}
                                                >
                                                    <div className="flex items-start justify-between mb-1">
                                                        <p className="text-white font-black text-xs uppercase truncate flex-1">
                                                            {event.name}
                                                        </p>
                                                        {event.conflicts.length > 0 && (
                                                            <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white rounded text-[8px] font-black">
                                                                {event.conflicts.length}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-orange-200 font-mono text-[10px]">
                                                        {event.startTime} - {event.endTime}
                                                    </p>
                                                    {event.venue && (
                                                        <p className="text-orange-300 text-[9px] mt-1 truncate">
                                                            📍 {event.venue}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                </div>

                                {/* Field Events Column */}
                                <div className="relative h-[600px] bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
                                    <div className="absolute top-0 left-0 right-0 p-3 bg-blue-500/10 border-b border-blue-500/20">
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest text-center">
                                            Field Events
                                        </p>
                                    </div>

                                    {/* Lunch Break */}
                                    <div
                                        className="absolute left-0 right-0 bg-neutral-800/50 border-y border-neutral-700"
                                        style={{ top: '55.56%', height: '11.11%' }}
                                    >
                                        <p className="text-center text-[10px] font-black text-neutral-600 uppercase mt-2">
                                            Lunch Break
                                        </p>
                                    </div>

                                    {/* Field Events */}
                                    {getFilteredEvents(schedule.days[selectedDay].events)
                                        .filter(event => event.eventType === 'FIELD')
                                        .map((event, idx) => {
                                            const pos = getEventPosition(event.startTime, event.endTime);
                                            return (
                                                <div
                                                    key={idx}
                                                    className="absolute left-2 right-2 bg-blue-600 border border-blue-500 rounded-xl p-3 overflow-hidden hover:z-10 hover:shadow-lg transition-all cursor-pointer"
                                                    style={{ top: pos.top, height: pos.height, minHeight: '60px' }}
                                                >
                                                    <div className="flex items-start justify-between mb-1">
                                                        <p className="text-white font-black text-xs uppercase truncate flex-1">
                                                            {event.name}
                                                        </p>
                                                        {event.conflicts.length > 0 && (
                                                            <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white rounded text-[8px] font-black">
                                                                {event.conflicts.length}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-blue-200 font-mono text-[10px]">
                                                        {event.startTime} - {event.endTime}
                                                    </p>
                                                    {event.venue && (
                                                        <p className="text-blue-300 text-[9px] mt-1 truncate">
                                                            📍 {event.venue}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Conflicts Detail */}
                    {stats.total > 0 && (
                        <section className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6">
                            <h2 className="text-lg font-black text-white uppercase tracking-tight mb-4">
                                Conflict Details
                            </h2>
                            <div className="space-y-3">
                                {schedule.days[selectedDay].events
                                    .filter(event => event.conflicts.length > 0)
                                    .map((event, idx) => (
                                        <div key={idx} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="text-white font-black text-sm">{event.name}</p>
                                                    <p className="text-neutral-500 text-xs font-mono">
                                                        {event.startTime} - {event.endTime}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${event.eventType === 'TRACK'
                                                        ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                                                        : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {event.eventType}
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                {event.conflicts.map((conflict, cIdx) => (
                                                    <div
                                                        key={cIdx}
                                                        className={`flex items-start gap-2 p-2 rounded-lg border ${conflict.type === 'LUNCH_VIOLATION'
                                                                ? 'bg-red-500/10 border-red-500/20'
                                                                : conflict.type === 'ATHLETE_CONFLICT'
                                                                    ? 'bg-orange-500/10 border-orange-500/20'
                                                                    : 'bg-yellow-500/10 border-yellow-500/20'
                                                            }`}
                                                    >
                                                        <span className="text-lg">
                                                            {conflict.type === 'LUNCH_VIOLATION' ? '🍽️' :
                                                                conflict.type === 'ATHLETE_CONFLICT' ? '👥' : '⏱️'}
                                                        </span>
                                                        <div className="flex-1">
                                                            <p className={`text-xs font-bold uppercase tracking-wider ${conflict.type === 'LUNCH_VIOLATION'
                                                                    ? 'text-red-400'
                                                                    : conflict.type === 'ATHLETE_CONFLICT'
                                                                        ? 'text-orange-400'
                                                                        : 'text-yellow-400'
                                                                }`}>
                                                                {conflict.type.replace(/_/g, ' ')}
                                                            </p>
                                                            <p className="text-neutral-400 text-xs mt-0.5">
                                                                {conflict.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </section>
                    )}
                </>
            )}
        </main>
    );
}
