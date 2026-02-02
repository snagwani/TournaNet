"use client";

import React, { useState, useEffect, useCallback } from 'react';
import RequireAuth from '../../../components/RequireAuth';
import { useAuth } from '../../../app/context/AuthContext';
import { useRouter } from 'next/navigation';

interface AthletePerformance {
    athleteId: string;
    athleteName: string;
    bibNumber: number;
    schoolName: string;
    category: string;
    gender: string;
    eventsCount: number;
}

interface SchoolOption {
    id: string;
    name: string;
}

export default function AthletesReportPage() {
    const [athletes, setAthletes] = useState<AthletePerformance[]>([]);
    const [schoolsList, setSchoolsList] = useState<SchoolOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        schoolId: '',
        category: '',
        gender: ''
    });

    const { user } = useAuth();
    const router = useRouter();

    const fetchSchools = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:3001/api/admin/reports/schools', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setSchoolsList((data.schools || []).map((s: any) => ({
                    id: s.schoolId,
                    name: s.schoolName
                })));
            }
        } catch (err) {
            console.error('Failed to fetch schools list', err);
        }
    }, []);

    const fetchAthletes = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (filters.schoolId) params.append('schoolId', filters.schoolId);
            if (filters.category) params.append('category', filters.category);
            if (filters.gender) params.append('gender', filters.gender);

            const response = await fetch(`http://localhost:3001/api/admin/reports/athletes?${params.toString()}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to fetch athlete reports');
            }

            const data = await response.json();
            setAthletes(data.athletes || []);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        if (user) {
            fetchSchools();
        }
    }, [user, fetchSchools]);

    useEffect(() => {
        if (user) {
            fetchAthletes();
        }
    }, [user, fetchAthletes]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            schoolId: '',
            category: '',
            gender: ''
        });
    };

    const isFiltered = filters.schoolId || filters.category || filters.gender;

    return (
        <RequireAuth allowedRoles={['ADMIN']}>
            <main className="min-h-screen bg-neutral-950 p-8 space-y-8">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-800 pb-6 gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                            Athlete Reports
                        </h1>
                        <p className="text-neutral-500 text-sm font-mono uppercase tracking-widest">
                            Tournament Analytics • Athlete Statistics
                        </p>
                    </div>
                    {isFiltered && (
                        <button
                            onClick={clearFilters}
                            className="text-[10px] text-neutral-500 hover:text-white uppercase tracking-[0.2em] font-bold transition-colors flex items-center gap-2 group bg-neutral-900/50 px-4 py-2 rounded-full border border-neutral-800/50 hover:border-neutral-700 animate-in fade-in slide-in-from-right-2"
                        >
                            <span className="w-5 h-5 rounded-full border border-neutral-800 flex items-center justify-center group-hover:border-neutral-600 transition-colors">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </span>
                            Clear All Filters
                        </button>
                    )}
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-900/20 p-4 rounded-3xl border border-neutral-800/50">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest ml-1">Filter by School</label>
                        <select
                            value={filters.schoolId}
                            onChange={(e) => handleFilterChange('schoolId', e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-neutral-700 transition-colors appearance-none cursor-pointer"
                        >
                            <option value="">All Schools</option>
                            {schoolsList.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest ml-1">Category</label>
                        <select
                            value={filters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-neutral-700 transition-colors appearance-none cursor-pointer"
                        >
                            <option value="">All Categories</option>
                            <option value="U14">U14 (Under 14)</option>
                            <option value="U17">U17 (Under 17)</option>
                            <option value="U19">U19 (Under 19)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest ml-1">Gender</label>
                        <select
                            value={filters.gender}
                            onChange={(e) => handleFilterChange('gender', e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-neutral-700 transition-colors appearance-none cursor-pointer"
                        >
                            <option value="">All Genders</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                        </select>
                    </div>
                </div>

                <section className="bg-neutral-900/30 border border-neutral-800 rounded-[2rem] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-neutral-900/50 border-b border-neutral-800">
                                    <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500">Athlete Name</th>
                                    <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">Bib #</th>
                                    <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500">School</th>
                                    <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">Category</th>
                                    <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">Gender</th>
                                    <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-right">Events Participated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <tr key={i} className="border-b border-neutral-800/50">
                                            <td className="px-6 py-6 font-bold">
                                                <div className="h-4 w-32 bg-neutral-800/50 animate-pulse rounded-full" />
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="h-4 w-12 bg-neutral-800/50 animate-pulse rounded-full mx-auto" />
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="h-4 w-40 bg-neutral-800/50 animate-pulse rounded-full" />
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="h-4 w-12 bg-neutral-800/50 animate-pulse rounded-full mx-auto" />
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="h-4 w-16 bg-neutral-800/50 animate-pulse rounded-full mx-auto" />
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="h-4 w-8 bg-neutral-800/50 animate-pulse rounded-full ml-auto" />
                                            </td>
                                        </tr>
                                    ))
                                ) : athletes.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center space-y-4">
                                                <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-3xl flex items-center justify-center">
                                                    <svg className="w-8 h-8 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-white font-bold text-lg">No Matching Athletes</p>
                                                    <p className="text-neutral-500 text-sm max-w-xs mx-auto">
                                                        No athletes found with the current filter criteria.
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    athletes.map((athlete: AthletePerformance) => (
                                        <tr
                                            key={athlete.athleteId}
                                            onClick={() => router.push(`/admin/athletes/${athlete.athleteId}`)}
                                            className="border-b border-neutral-800/50 hover:bg-white/[0.04] transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-6">
                                                <span className="text-white font-bold group-hover:text-white transition-colors capitalize">
                                                    {athlete.athleteName}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <span className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-400 font-mono text-xs uppercase tracking-tight">
                                                    #{athlete.bibNumber}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className="text-neutral-400 text-sm capitalize">{athlete.schoolName}</span>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded text-[10px] font-bold font-mono">
                                                    {athlete.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${athlete.gender === 'MALE'
                                                    ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                                    : 'bg-pink-500/10 border-pink-500/20 text-pink-400'
                                                    }`}>
                                                    {athlete.gender}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <span className="text-xl font-black text-white tracking-tight italic">
                                                    {athlete.eventsCount}
                                                </span>
                                                <span className="text-[10px] text-neutral-500 ml-1 font-mono uppercase tracking-widest">Events</span>
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
