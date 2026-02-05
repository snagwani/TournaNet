"use client";

import React from 'react';
import { useTimezone } from '@/app/context/TimezoneContext';
import { getAvailableTimezones } from '@/lib/timeUtils';

export function TimezoneSelector() {
    const { timezone, setTimezone } = useTimezone();
    const timezones = getAvailableTimezones();

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/50 border border-neutral-800 rounded-xl transition-all hover:border-neutral-700">
            <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="bg-transparent text-[10px] font-bold text-neutral-400 uppercase tracking-widest focus:outline-none cursor-pointer appearance-none"
            >
                {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value} className="bg-neutral-900 text-white">
                        {tz.label}
                    </option>
                ))}
            </select>
            {/* Custom Arrow */}
            <svg className="w-2.5 h-2.5 text-neutral-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </div>
    );
}
