"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../app/context/AuthContext';

type EventType = 'TRACK' | 'FIELD';
type Gender = 'MALE' | 'FEMALE';
type Category = 'U14' | 'U17' | 'U19';

interface TrackRules {
    maxAthletesPerHeat: number;
    qualificationRule: string;
}

interface FieldRules {
    maxAthletesPerFlight: number;
    attempts: number;
    finalists: number;
}

const EVENT_NAMES = {
    TRACK: ['100m Sprint', '200m Sprint', '400m Dash', '800m Run', '1500m Run', '4x100m Relay', '4x400m Relay'],
    FIELD: ['Long Jump', 'High Jump', 'Shot Put', 'Discus Throw', 'Javelin Throw', 'Triple Jump']
};

export default function CreateEventPage() {
    const router = useRouter();
    const { user } = useAuth();
    const warningsRef = useRef<HTMLDivElement>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        eventType: 'TRACK' as EventType,
        gender: 'MALE' as Gender,
        category: 'U14' as Category,
        date: '',
        startTime: '',
        venue: ''
    });

    const [trackRules, setTrackRules] = useState<TrackRules>({
        maxAthletesPerHeat: 8,
        qualificationRule: 'TOP_2_PER_HEAT'
    });

    const [fieldRules, setFieldRules] = useState<FieldRules>({
        maxAthletesPerFlight: 12,
        attempts: 3,
        finalists: 8
    });

    const [warnings, setWarnings] = useState<string[]>([]);
    const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

    // Validate date (not in the past)
    const validateDate = (date: string): string[] => {
        const warnings: string[] = [];

        if (!date) return warnings;

        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day

        if (selectedDate < today) {
            warnings.push('🚫 Cannot schedule events in the past. Please select a future date.');
        }

        return warnings;
    };

    // Validate time constraints
    const validateTime = (time: string): string[] => {
        const warnings: string[] = [];

        if (!time) return warnings;

        const [hours, minutes] = time.split(':').map(Number);
        const timeInMinutes = hours * 60 + minutes;

        // Check if during lunch break (13:00-14:00)
        if (timeInMinutes >= 13 * 60 && timeInMinutes < 14 * 60) {
            warnings.push('⚠️ Events cannot be scheduled during lunch break (13:00-14:00)');
        }

        // Check if outside allowed hours (08:00-17:00)
        if (timeInMinutes < 8 * 60 || timeInMinutes >= 17 * 60) {
            warnings.push('⚠️ Events must be scheduled between 08:00 and 17:00');
        }

        return warnings;
    };

    // Check for conflicts with existing events
    const checkConflicts = async () => {
        if (!formData.date || !formData.startTime || !formData.category || !formData.gender) {
            return;
        }

        setIsCheckingConflicts(true);
        const newWarnings: string[] = [];

        try {
            // Validate date first (check for past dates)
            const dateWarnings = validateDate(formData.date);
            newWarnings.push(...dateWarnings);

            // Validate time
            const timeWarnings = validateTime(formData.startTime);
            newWarnings.push(...timeWarnings);

            // Fetch existing events for the same date, category, and gender
            const response = await fetch('http://localhost:3001/api/events', {
                credentials: 'include'
            });

            if (response.ok) {
                const events = await response.json();

                // Filter events for same date, category, and gender
                const conflictingEvents = events.filter((event: any) => {
                    const eventDate = new Date(event.date).toISOString().split('T')[0];
                    const selectedDate = formData.date;

                    return eventDate === selectedDate &&
                        event.category === formData.category &&
                        event.gender === formData.gender;
                });

                if (conflictingEvents.length > 0) {
                    newWarnings.push(
                        `⚠️ ${conflictingEvents.length} existing event(s) found for ${formData.gender} ${formData.category} on this date. Athletes may have scheduling conflicts.`
                    );

                    // Check for time overlaps
                    const selectedTime = formData.startTime;
                    const overlappingEvents = conflictingEvents.filter((event: any) => {
                        return event.startTime === selectedTime;
                    });

                    if (overlappingEvents.length > 0) {
                        newWarnings.push(
                            `🚫 ${overlappingEvents.length} event(s) scheduled at the same time (${selectedTime}). This will cause athlete conflicts!`
                        );
                    }
                }
            }
        } catch (err) {
            console.error('Error checking conflicts:', err);
        } finally {
            setWarnings(newWarnings);
            setIsCheckingConflicts(false);
        }
    };

    // Check conflicts when date, time, category, or gender changes
    useEffect(() => {
        checkConflicts();
    }, [formData.date, formData.startTime, formData.category, formData.gender]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Check if there are any validation warnings
        if (warnings.length > 0) {
            setError('Please fix the validation warnings before creating the event.');
            // Scroll to top to show errors
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setIsSubmitting(true);

        try {
            const rules = formData.eventType === 'TRACK' ? trackRules : fieldRules;

            const response = await fetch('http://localhost:3001/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    ...formData,
                    rules
                })
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to create event');
            }

            const data = await response.json();
            router.push(`/admin/events/${data.id}`);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
            // Scroll to top to show error message
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSubmitting(false);
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
        <main className="p-8 max-w-4xl mx-auto space-y-8">
            <header className="border-b border-neutral-800 pb-6">
                <div className="flex items-center gap-4 mb-2">
                    <button
                        onClick={() => router.back()}
                        className="text-neutral-500 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                        Create New Event
                    </h1>
                </div>
                <p className="text-neutral-500 text-sm font-mono uppercase tracking-widest">
                    Configure Event Details • Set Competition Rules
                </p>
            </header>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                    <p className="text-red-400 text-sm font-bold">{error}</p>
                </div>
            )}

            {/* Conflict Warnings */}
            {warnings.length > 0 && (
                <div ref={warningsRef} className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-amber-400 text-lg">⚠️</span>
                        <p className="text-amber-400 text-sm font-black uppercase tracking-wider">
                            Scheduling Warnings
                        </p>
                        {isCheckingConflicts && (
                            <span className="ml-auto text-xs text-neutral-500 animate-pulse">Checking...</span>
                        )}
                    </div>
                    {warnings.map((warning, idx) => (
                        <div
                            key={idx}
                            className={`p-3 rounded-xl border ${warning.includes('🚫')
                                ? 'bg-red-500/10 border-red-500/20'
                                : 'bg-amber-500/10 border-amber-500/20'
                                }`}
                        >
                            <p className={`text-sm font-bold ${warning.includes('🚫') ? 'text-red-400' : 'text-amber-400'
                                }`}>
                                {warning}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Event Name */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 space-y-4">
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Event Information</h2>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                            Event Name *
                        </label>
                        <select
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all"
                        >
                            <option value="">Select Event</option>
                            {EVENT_NAMES[formData.eventType].map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Event Type */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                            Event Type *
                        </label>
                        <div className="flex gap-4">
                            {(['TRACK', 'FIELD'] as EventType[]).map(type => (
                                <label
                                    key={type}
                                    className={`flex-1 cursor-pointer border-2 rounded-xl p-4 transition-all ${formData.eventType === type
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-700'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="eventType"
                                        value={type}
                                        checked={formData.eventType === type}
                                        onChange={(e) => setFormData({ ...formData, eventType: e.target.value as EventType, name: '' })}
                                        className="sr-only"
                                    />
                                    <div className="text-center">
                                        <span className="text-2xl mb-2 block">{type === 'TRACK' ? '🏃' : '🏋️'}</span>
                                        <span className="text-white text-sm font-black uppercase">{type}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                            Gender *
                        </label>
                        <div className="flex gap-4">
                            {(['MALE', 'FEMALE'] as Gender[]).map(gender => (
                                <label
                                    key={gender}
                                    className={`flex-1 cursor-pointer border-2 rounded-xl p-4 transition-all ${formData.gender === gender
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-700'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="gender"
                                        value={gender}
                                        checked={formData.gender === gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                                        className="sr-only"
                                    />
                                    <div className="text-center">
                                        <span className="text-white text-sm font-black uppercase">{gender}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                            Age Category *
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                            {(['U14', 'U17', 'U19'] as Category[]).map(category => (
                                <label
                                    key={category}
                                    className={`cursor-pointer border-2 rounded-xl p-4 transition-all ${formData.category === category
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-700'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="category"
                                        value={category}
                                        checked={formData.category === category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                                        className="sr-only"
                                    />
                                    <div className="text-center">
                                        <span className="text-white text-sm font-black uppercase">{category}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Schedule */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 space-y-4">
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Schedule</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                                Date *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                                Start Time * (08:00-17:00, excluding 13:00-14:00)
                            </label>
                            <input
                                type="time"
                                required
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                            Venue (Optional)
                        </label>
                        <input
                            type="text"
                            value={formData.venue}
                            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                            placeholder="e.g., Main Stadium, Field Arena"
                            className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all placeholder:text-neutral-600"
                        />
                    </div>
                </div>

                {/* Rules Configuration */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 space-y-4">
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">
                        {formData.eventType} Rules
                    </h2>

                    {formData.eventType === 'TRACK' ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                                    Max Athletes Per Heat
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={trackRules.maxAthletesPerHeat}
                                    onChange={(e) => setTrackRules({ ...trackRules, maxAthletesPerHeat: parseInt(e.target.value) })}
                                    className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                                    Qualification Rule
                                </label>
                                <select
                                    value={trackRules.qualificationRule}
                                    onChange={(e) => setTrackRules({ ...trackRules, qualificationRule: e.target.value })}
                                    className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all"
                                >
                                    <option value="TOP_2_PER_HEAT">Top 2 Per Heat</option>
                                    <option value="TOP_3_PER_HEAT">Top 3 Per Heat</option>
                                    <option value="TOP_4_OVERALL">Top 4 Overall</option>
                                </select>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                                    Max Athletes Per Flight
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={fieldRules.maxAthletesPerFlight}
                                    onChange={(e) => setFieldRules({ ...fieldRules, maxAthletesPerFlight: parseInt(e.target.value) })}
                                    className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                                        Attempts
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="6"
                                        value={fieldRules.attempts}
                                        onChange={(e) => setFieldRules({ ...fieldRules, attempts: parseInt(e.target.value) })}
                                        className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                                        Finalists
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="12"
                                        value={fieldRules.finalists}
                                        onChange={(e) => setFieldRules({ ...fieldRules, finalists: parseInt(e.target.value) })}
                                        className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl py-4 text-sm font-black uppercase tracking-widest transition-all border border-neutral-700"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-4 text-sm font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                    >
                        {isSubmitting ? 'Creating Event...' : 'Create Event'}
                    </button>
                </div>
            </form>
        </main>
    );
}
