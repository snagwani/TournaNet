"use client";

import React, { use, useState, useEffect, useCallback } from 'react';
import RequireAuth from '@/components/RequireAuth';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';

interface AthletePerformance {
    athleteId: string;
    name: string;
    bibNumber: number;
    category: string;
    gender: string;
    gold: number;
    silver: number;
    bronze: number;
    events: {
        eventName: string;
        eventType: string;
        rank: number | null;
        resultValue: string | null;
        status: string;
    }[];
}

interface SchoolDetail {
    schoolId: string;
    schoolName: string;
    district: string;
    logoUrl?: string;
    athletesCount: number;
    eventsParticipated: number;
    gold: number;
    silver: number;
    bronze: number;
    totalPoints: number;
    athletes: AthletePerformance[];
}

export default function SchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const router = useRouter();

    const [school, setSchool] = useState<SchoolDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSchoolDetail = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:3001/api/admin/reports/schools/${id}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('School not found');
                }
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to fetch school details');
            }

            const data = await response.json();
            setSchool(data);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (!user || !id) {
            setIsLoading(false);
            return;
        }
        fetchSchoolDetail();
    }, [user, id, fetchSchoolDetail]);

    if (isLoading) {
        return (
            <RequireAuth allowedRoles={['ADMIN']}>
                <main className="min-h-screen bg-neutral-950 p-8 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-neutral-800 border-t-white rounded-full animate-spin mb-4" />
                    <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest animate-pulse">Syncing School Data...</p>
                </main>
            </RequireAuth>
        );
    }

    if (error || !school) {
        return (
            <RequireAuth allowedRoles={['ADMIN']}>
                <main className="min-h-screen bg-neutral-950 p-8 flex flex-col items-center justify-center space-y-6">
                    <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-white text-2xl font-black uppercase italic tracking-tighter">School Not Found</h2>
                        <p className="text-neutral-500 text-sm max-w-xs">{error || 'The requested school analytics could not be loaded.'}</p>
                    </div>
                    <button
                        onClick={() => router.push('/admin/schools')}
                        className="px-8 py-3 bg-white text-black font-black uppercase text-xs tracking-widest rounded-full hover:bg-neutral-200 transition-colors"
                    >
                        Back to School List
                    </button>
                </main>
            </RequireAuth>
        );
    }

    return (
        <RequireAuth allowedRoles={['ADMIN']}>
            <main className="min-h-screen bg-neutral-950 p-8 space-y-12">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-900 pb-8 gap-6">
                    <div className="flex items-center gap-6">
                        {school.logoUrl && (
                            <div className="flex-shrink-0">
                                <img
                                    src={`http://localhost:3001${school.logoUrl}`}
                                    alt={`${school.schoolName} Logo`}
                                    className="w-24 h-24 rounded-full object-cover border-2 border-neutral-800 bg-neutral-900 shadow-2xl"
                                />
                            </div>
                        )}
                        <div className="space-y-4">
                            <Link
                                href="/admin/schools"
                                className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 hover:text-white transition-colors flex items-center gap-2 group"
                            >
                                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back to District Ledger
                            </Link>
                            <div className="space-y-1">
                                <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic leading-none">
                                    {school.schoolName}
                                </h1>
                                <p className="text-blue-500 font-mono text-xs uppercase tracking-[0.4em] font-bold">
                                    {school.district} • Tournament Analytics
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="px-6 py-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-center">
                            <span className="block text-[8px] text-neutral-500 uppercase font-black tracking-widest mb-1">Total Points</span>
                            <span className="text-2xl font-black text-white italic">{school.totalPoints}</span>
                        </div>
                    </div>
                </header>

                <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Athletes', value: school.athletesCount, color: 'text-white' },
                        { label: 'Events', value: school.eventsParticipated, color: 'text-neutral-400' },
                        { label: 'Gold', value: school.gold, color: 'text-amber-400' },
                        { label: 'Silver', value: school.silver, color: 'text-neutral-300' },
                        { label: 'Bronze', value: school.bronze, color: 'text-amber-700' },
                        { label: 'Efficiency', value: `${((school.gold + school.silver + school.bronze) / Math.max(1, school.eventsParticipated) * 100).toFixed(0)}%`, color: 'text-blue-400' },
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-3xl flex flex-col items-center text-center justify-center space-y-1">
                            <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-600 font-black">{stat.label}</span>
                            <span className={`text-2xl font-black italic ${stat.color}`}>{stat.value}</span>
                        </div>
                    ))}
                </section>

                <section className="space-y-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-neutral-500">Athlete Performance Ledger</h2>
                        <div className="h-px flex-1 bg-neutral-900" />
                    </div>

                    <div className="bg-neutral-900/30 border border-neutral-800 rounded-[2.5rem] overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-neutral-900/50 border-b border-neutral-800 text-neutral-500">
                                    <th className="px-8 py-6 text-[10px] font-mono uppercase tracking-widest">Athlete</th>
                                    <th className="px-8 py-6 text-[10px] font-mono uppercase tracking-widest">Category</th>
                                    <th className="px-8 py-6 text-[10px] font-mono uppercase tracking-widest text-center">Medals</th>
                                    <th className="px-8 py-6 text-[10px] font-mono uppercase tracking-widest text-right">Events</th>
                                </tr>
                            </thead>
                            <tbody>
                                {school.athletes.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-12 text-center text-neutral-700 font-mono text-xs uppercase tracking-widest">
                                            No athlete data synchronized
                                        </td>
                                    </tr>
                                ) : (
                                    school.athletes.map((athlete) => (
                                        <tr key={athlete.athleteId} className="border-b border-neutral-800/50 hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-8 py-6">
                                                <Link href={`/admin/athletes/${athlete.athleteId}`} className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center font-black text-white group-hover:bg-blue-600 transition-colors">
                                                        #{athlete.bibNumber}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-white uppercase italic group-hover:text-blue-400 transition-colors">{athlete.name}</p>
                                                        <p className="text-[9px] text-neutral-500 font-mono uppercase">{athlete.gender}</p>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="px-2 py-1 bg-neutral-800 rounded text-[9px] font-black text-neutral-400 uppercase tracking-tighter">
                                                    {athlete.category}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-center gap-2">
                                                    {athlete.gold > 0 && <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px] font-black text-amber-500">{athlete.gold}G</span>}
                                                    {athlete.silver > 0 && <span className="w-6 h-6 rounded-full bg-neutral-300/20 border border-neutral-300/30 flex items-center justify-center text-[10px] font-black text-neutral-300">{athlete.silver}S</span>}
                                                    {athlete.bronze > 0 && <span className="w-6 h-6 rounded-full bg-amber-800/20 border border-amber-800/30 flex items-center justify-center text-[10px] font-black text-amber-800">{athlete.bronze}B</span>}
                                                    {athlete.gold === 0 && athlete.silver === 0 && athlete.bronze === 0 && <span className="text-neutral-700 font-mono text-[10px]">—</span>}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="text-sm font-black text-white italic">{athlete.events.length}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <footer className="pt-8 border-t border-neutral-900 flex justify-between items-center text-neutral-700 font-mono text-[9px] uppercase tracking-widest">
                    <span>Performance Data Verified</span>
                    <span>TournaNet Analytics Core</span>
                </footer>
            </main>
        </RequireAuth>
    );
}
