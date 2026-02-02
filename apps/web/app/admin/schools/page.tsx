"use client";

import React, { useState, useEffect } from 'react';
import RequireAuth from '../../../components/RequireAuth';

interface SchoolPerformance {
    id: string;
    name: string;
    athletesCount: number;
    eventsParticipated: number;
    gold: number;
    silver: number;
    bronze: number;
    totalPoints: number;
}

const MOCK_SCHOOLS: SchoolPerformance[] = [
    {
        id: '1',
        name: 'Silverwood High',
        athletesCount: 42,
        eventsParticipated: 15,
        gold: 8,
        silver: 4,
        bronze: 2,
        totalPoints: 120,
    },
    {
        id: '2',
        name: 'Mountain View Academy',
        athletesCount: 35,
        eventsParticipated: 12,
        gold: 5,
        silver: 7,
        bronze: 3,
        totalPoints: 95,
    },
    {
        id: '3',
        name: 'Oak Ridge Collegiate',
        athletesCount: 28,
        eventsParticipated: 10,
        gold: 3,
        silver: 5,
        bronze: 6,
        totalPoints: 72,
    },
    {
        id: '4',
        name: 'Riverside Preparatory',
        athletesCount: 50,
        eventsParticipated: 18,
        gold: 10,
        silver: 2,
        bronze: 5,
        totalPoints: 135,
    },
];

export default function SchoolsReportPage() {
    const [schools, setSchools] = useState<SchoolPerformance[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate API fetch
        const timer = setTimeout(() => {
            setSchools(MOCK_SCHOOLS);
            setIsLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <RequireAuth allowedRoles={['ADMIN']}>
            <main className="min-h-screen bg-neutral-950 p-8 space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-800 pb-6 gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                            School Performance Report
                        </h1>
                        <p className="text-neutral-500 text-sm font-mono uppercase tracking-widest">
                            Tournament Analytics • Points Standing
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <div className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-bold text-white uppercase tracking-widest">
                            Session: 2026 Admin
                        </div>
                    </div>
                </header>

                <section className="bg-neutral-900/30 border border-neutral-800 rounded-[2rem] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-neutral-900/50 border-b border-neutral-800">
                                    <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500">School Name</th>
                                    <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">Athletes</th>
                                    <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">Events</th>
                                    <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">Gold</th>
                                    <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">Silver</th>
                                    <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">Bronze</th>
                                    <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-right">Total Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    // Loading Skeletons
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="border-b border-neutral-800/50">
                                            <td className="px-6 py-6">
                                                <div className="h-4 w-48 bg-neutral-800/50 animate-pulse rounded-full" />
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="h-4 w-12 bg-neutral-800/50 animate-pulse rounded-full mx-auto" />
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="h-4 w-12 bg-neutral-800/50 animate-pulse rounded-full mx-auto" />
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="h-4 w-8 bg-neutral-800/50 animate-pulse rounded-full mx-auto" />
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="h-4 w-8 bg-neutral-800/50 animate-pulse rounded-full mx-auto" />
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="h-4 w-8 bg-neutral-800/50 animate-pulse rounded-full mx-auto" />
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="h-5 w-16 bg-neutral-800/50 animate-pulse rounded-full ml-auto" />
                                            </td>
                                        </tr>
                                    ))
                                ) : schools.length === 0 ? (
                                    // Empty State
                                    <tr>
                                        <td colSpan={7} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center space-y-4">
                                                <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-3xl flex items-center justify-center">
                                                    <svg className="w-8 h-8 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-white font-bold text-lg">No Schools Data Available</p>
                                                    <p className="text-neutral-500 text-sm max-w-xs mx-auto">
                                                        The performance report will be populated once event results are submitted.
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    // Data Rows
                                    schools.map((school) => (
                                        <tr key={school.id} className="border-b border-neutral-800/50 hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-6">
                                                <span className="text-white font-bold group-hover:text-white transition-colors capitalize">
                                                    {school.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <span className="text-neutral-400 font-mono text-sm">{school.athletesCount}</span>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <span className="text-neutral-400 font-mono text-sm">{school.eventsParticipated}</span>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                                                    <span className="text-white font-bold font-mono">{school.gold}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-neutral-400 shadow-[0_0_8px_rgba(163,163,163,0.5)]" />
                                                    <span className="text-white font-bold font-mono">{school.silver}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-amber-700 shadow-[0_0_8px_rgba(180,83,9,0.5)]" />
                                                    <span className="text-white font-bold font-mono">{school.bronze}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <span className="text-xl font-black text-white tracking-tight italic">
                                                    {school.totalPoints}
                                                </span>
                                                <span className="text-[10px] text-neutral-500 ml-1 font-mono uppercase tracking-widest">PTS</span>
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
                        TournaNet Analytics Engine • Build 2026.02.02
                    </p>
                </footer>
            </main>
        </RequireAuth>
    );
}
