"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../app/context/AuthContext';
import { useRouter } from 'next/navigation';

interface SchoolPerformance {
    schoolId: string;
    schoolName: string;
    district: string;
    athletesCount: number;
    eventsParticipated: number;
    gold: number;
    silver: number;
    bronze: number;
    totalPoints: number;
}

export default function SchoolsReportPage() {
    const [schools, setSchools] = useState<SchoolPerformance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');

    const { user } = useAuth();
    const router = useRouter();

    const fetchSchools = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3001/api/admin/reports/schools', {
                credentials: 'include'
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to fetch school reports');
            }

            const data = await response.json();
            const rawSchools = data.schools || [];

            // Sort logic: Gold > Silver > Bronze > Total Points
            const sorted = [...rawSchools].sort((a: SchoolPerformance, b: SchoolPerformance) => {
                if (b.gold !== a.gold) return b.gold - a.gold;
                if (b.silver !== a.silver) return b.silver - a.silver;
                if (b.bronze !== a.bronze) return b.bronze - a.bronze;
                return b.totalPoints - a.totalPoints;
            });

            setSchools(sorted);
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
        fetchSchools();
    }, [user, fetchSchools]);

    // Derived state for districts
    const districts = Array.from(new Set(schools.map(s => s.district))).sort();

    // Filtering logic
    const filteredSchools = schools.filter(school => {
        const matchesSearch = school.schoolName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDistrict = selectedDistrict === '' || school.district === selectedDistrict;
        return matchesSearch && matchesDistrict;
    });

    return (
        <main className="p-8 space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-800 pb-6 gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                        School Performance Report
                    </h1>
                    <p className="text-neutral-500 text-sm font-mono uppercase tracking-widest">
                        Tournament Analytics • Points Standing
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => router.push('/admin/schools/register')}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 border border-blue-500 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Register New School
                    </button>
                    <button
                        onClick={() => fetchSchools()}
                        disabled={isLoading}
                        className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-[10px] font-bold text-neutral-400 uppercase tracking-widest hover:text-white hover:border-neutral-700 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        <svg className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh Data
                    </button>
                    <div className="px-4 py-2 bg-neutral-900/50 border border-neutral-800 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest flex items-center">
                        Session: 2026 Admin
                    </div>
                </div>
            </header>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-900/20 p-4 rounded-3xl border border-neutral-800/50">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest ml-1">Search Schools</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Enter school name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-10 py-2.5 text-xs text-white focus:outline-none focus:border-neutral-700 transition-colors"
                        />
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest ml-1">District / City</label>
                    <select
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-neutral-700 transition-colors appearance-none cursor-pointer"
                    >
                        <option value="">All Districts</option>
                        {districts.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-4 px-6 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{error}</span>
                    </div>
                    <button
                        onClick={() => fetchSchools()}
                        className="text-[10px] uppercase tracking-widest underline decoration-2 underline-offset-4 font-bold"
                    >
                        Try Again
                    </button>
                </div>
            )}

            <section className="bg-neutral-900/30 border border-neutral-800 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-900/50 border-b border-neutral-800">
                                <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500">School Name</th>
                                <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">District</th>
                                <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">Athletes</th>
                                <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">Gold</th>
                                <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">Silver</th>
                                <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-center">Bronze</th>
                                <th className="px-6 py-5 text-xs font-mono uppercase tracking-widest text-neutral-500 text-right">Total Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-neutral-800/50">
                                        <td className="px-6 py-6">
                                            <div className="h-4 w-48 bg-neutral-800/50 animate-pulse rounded-full" />
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="h-4 w-24 bg-neutral-800/50 animate-pulse rounded-full mx-auto" />
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
                            ) : filteredSchools.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center space-y-4">
                                            <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-3xl flex items-center justify-center">
                                                <svg className="w-8 h-8 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-white font-bold text-lg">No Matching Schools</p>
                                                <p className="text-neutral-500 text-sm max-w-xs mx-auto">
                                                    Try adjusting your filters to find the school you're looking for.
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredSchools.map((school, index) => {
                                    const isFirst = index === 0 && searchQuery === '' && selectedDistrict === '';
                                    return (
                                        <tr
                                            key={school.schoolId}
                                            onClick={() => router.push(`/admin/schools/${school.schoolId}`)}
                                            className={`
                                                border-b border-neutral-800/50 transition-all duration-300 group cursor-pointer
                                                ${isFirst ? 'bg-yellow-500/[0.03] relative' : 'hover:bg-white/[0.04]'}
                                            `}
                                        >
                                            <td className="px-6 py-6 ring-inset">
                                                <div className="flex items-center gap-3">
                                                    {isFirst && (
                                                        <div className="w-1.5 h-6 bg-yellow-500 rounded-full shadow-[0_0_12px_rgba(234,179,8,0.4)]" />
                                                    )}
                                                    <span className={`font-bold capitalize transition-colors ${isFirst ? 'text-yellow-500/90' : 'text-white'}`}>
                                                        {school.schoolName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <span className="text-neutral-500 text-xs font-bold uppercase tracking-wider">{school.district}</span>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <span className="text-neutral-500 font-mono text-xs">{school.athletesCount}</span>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={`text-lg font-black font-mono transition-all ${school.gold > 0 ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]' : 'text-neutral-700'}`}>
                                                        {school.gold}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-yellow-500/40 uppercase tracking-tighter">Gold</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={`text-lg font-black font-mono transition-all ${school.silver > 0 ? 'text-neutral-300 drop-shadow-[0_0_8px_rgba(212,212,212,0.2)]' : 'text-neutral-700'}`}>
                                                        {school.silver}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-neutral-400/40 uppercase tracking-tighter">Silver</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={`text-lg font-black font-mono transition-all ${school.bronze > 0 ? 'text-amber-600 drop-shadow-[0_0_8px_rgba(180,83,9,0.2)]' : 'text-neutral-700'}`}>
                                                        {school.bronze}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-amber-700/40 uppercase tracking-tighter">Bronze</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className={`text-2xl font-black tracking-tighter italic transition-all ${isFirst ? 'text-yellow-500' : 'text-white'}`}>
                                                        {school.totalPoints}
                                                    </span>
                                                    <span className="text-[9px] text-neutral-600 font-mono uppercase tracking-[0.2em]">Standing Points</span>
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
                    TournaNet Analytics Engine • Build 2026.02.04
                </p>
            </footer>
        </main>
    );
}
