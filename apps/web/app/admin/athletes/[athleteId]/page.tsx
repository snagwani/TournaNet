"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RequireAuth from '../../../../components/RequireAuth';
import { useAuth } from '../../../../app/context/AuthContext';

interface EventResult {
    eventId: string;
    eventName: string;
    eventType: string;
    date: string;
    rank: number | null;
    resultValue: string | null;
    status: 'FINISHED' | 'DNS' | 'DNF' | 'DQ';
    notes: string | null;
}

interface AthleteDetail {
    athleteId: string;
    athleteName: string;
    bibNumber: number;
    schoolName: string;
    category: string;
    gender: string;
    personalBest: string | null;
    events: EventResult[];
}

export default function AthleteDetailPage() {
    const { athleteId } = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [athlete, setAthlete] = useState<AthleteDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAthleteDetail = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:3001/api/admin/reports/athletes/${athleteId}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Athlete not found');
                }
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to fetch athlete details');
            }

            const data = await response.json();
            setAthlete(data);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [athleteId]);

    useEffect(() => {
        if (user && athleteId) {
            fetchAthleteDetail();
        }
    }, [user, athleteId, fetchAthleteDetail]);

    if (isLoading) {
        return (
            <RequireAuth allowedRoles={['ADMIN']}>
                <main className="min-h-screen bg-neutral-950 p-8 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-neutral-800 border-t-white rounded-full animate-spin mb-4" />
                    <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Athlete Profile...</p>
                </main>
            </RequireAuth>
        );
    }

    if (error || !athlete) {
        return (
            <RequireAuth allowedRoles={['ADMIN']}>
                <main className="min-h-screen bg-neutral-950 p-8 flex flex-col items-center justify-center space-y-6">
                    <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-white text-2xl font-black uppercase italic tracking-tighter">Profile Not Found</h2>
                        <p className="text-neutral-500 text-sm max-w-xs">{error || 'The requested athlete profile could not be loaded.'}</p>
                    </div>
                    <button
                        onClick={() => router.push('/admin/athletes')}
                        className="px-8 py-3 bg-white text-black font-black uppercase text-xs tracking-widest rounded-full hover:bg-neutral-200 transition-colors"
                    >
                        Back to Athlete List
                    </button>
                </main>
            </RequireAuth>
        );
    }

    return (
        <RequireAuth allowedRoles={['ADMIN']}>
            <main className="min-h-screen bg-neutral-950 p-8 space-y-12">
                {/* Header & Back Navigation */}
                <header className="flex items-center justify-between border-b border-neutral-900 pb-8">
                    <button
                        onClick={() => router.push('/admin/athletes')}
                        className="flex items-center gap-3 text-neutral-500 hover:text-white transition-colors group"
                    >
                        <div className="w-10 h-10 rounded-full border border-neutral-900 flex items-center justify-center group-hover:border-neutral-700 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-[0.3em]">Back to Athletes</span>
                    </button>
                    <div className="text-right">
                        <span className="text-[10px] text-neutral-700 uppercase font-mono tracking-widest block mb-1">Athlete Passport • ID: {athlete.athleteId.slice(0, 8)}</span>
                        <span className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 font-mono text-xs uppercase tracking-tight">
                            #{athlete.bibNumber}
                        </span>
                    </div>
                </header>

                {/* Basic Info Section */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-neutral-800 to-neutral-950 border border-neutral-800 flex items-center justify-center text-5xl font-black text-white italic shadow-2xl">
                            {athlete.athleteName.charAt(0)}
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white break-words">{athlete.athleteName}</h2>
                            <p className="text-blue-400 font-mono text-xs uppercase tracking-widest font-bold">{athlete.schoolName}</p>
                        </div>
                    </div>

                    <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Category', value: athlete.category, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                            { label: 'Gender', value: athlete.gender, color: athlete.gender === 'MALE' ? 'text-blue-400' : 'text-pink-400', bg: athlete.gender === 'MALE' ? 'bg-blue-500/10' : 'bg-pink-500/10' },
                            { label: 'Personal Best', value: athlete.personalBest || 'N/A', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                            { label: 'Total Events', value: athlete.events.length.toString(), color: 'text-amber-400', bg: 'bg-amber-500/10' },
                        ].map((stat, idx) => (
                            <div key={idx} className={`${stat.bg} border border-neutral-900 rounded-3xl p-6 space-y-2 flex flex-col justify-center items-center text-center`}>
                                <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-600 font-bold">{stat.label}</span>
                                <span className={`text-xl font-black tracking-tight italic uppercase ${stat.color}`}>{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Performance History */}
                <section className="space-y-6">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-neutral-500">Performance History</h3>
                        <div className="h-px flex-1 bg-neutral-900" />
                    </div>

                    <div className="bg-neutral-900/30 border border-neutral-800 rounded-[2rem] overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-neutral-900/50 border-b border-neutral-800">
                                        <th className="px-6 py-5 text-[10px] font-mono uppercase tracking-widest text-neutral-500">Event</th>
                                        <th className="px-6 py-5 text-[10px] font-mono uppercase tracking-widest text-neutral-500">Type</th>
                                        <th className="px-6 py-5 text-[10px] font-mono uppercase tracking-widest text-neutral-500 text-center">Result</th>
                                        <th className="px-6 py-5 text-[10px] font-mono uppercase tracking-widest text-neutral-500 text-center">Rank</th>
                                        <th className="px-6 py-5 text-[10px] font-mono uppercase tracking-widest text-neutral-500 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {athlete.events.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-neutral-600 font-mono text-xs uppercase tracking-widest">
                                                No events participated yet
                                            </td>
                                        </tr>
                                    ) : (
                                        athlete.events.map((e, idx) => (
                                            <tr key={idx} className="border-b border-neutral-800/50 hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-6 font-bold text-white text-sm uppercase italic tracking-tight">{e.eventName}</td>
                                                <td className="px-6 py-6 text-neutral-500 font-mono text-[10px] uppercase">{e.eventType}</td>
                                                <td className="px-6 py-6 text-center font-black text-white italic tracking-tighter text-lg">{e.resultValue || '—'}</td>
                                                <td className="px-6 py-6 text-center shadow-inner">
                                                    {e.rank ? (
                                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs mx-auto ${e.rank === 1 ? 'bg-amber-500 text-black' :
                                                                e.rank === 2 ? 'bg-neutral-300 text-black' :
                                                                    e.rank === 3 ? 'bg-amber-700 text-white' :
                                                                        'bg-neutral-800 text-neutral-400'
                                                            }`}>
                                                            {e.rank}
                                                        </span>
                                                    ) : '—'}
                                                </td>
                                                <td className="px-6 py-6 text-right">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono border ${e.status === 'FINISHED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                            'bg-red-500/10 border-red-500/20 text-red-400'
                                                        }`}>
                                                        {e.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <footer className="pt-12 text-center border-t border-neutral-950">
                    <p className="text-[9px] text-neutral-800 uppercase tracking-[0.5em] font-medium transition-opacity hover:opacity-100 opacity-50">
                        Athlete Data Integrity Verified • TournaNet Core
                    </p>
                </footer>
            </main>
        </RequireAuth>
    );
}
