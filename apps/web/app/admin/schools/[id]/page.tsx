"use client";

import React from 'react';
import RequireAuth from '../../../../components/RequireAuth';
import Link from 'next/link';

export default function SchoolDetailPage({ params }: { params: { id: string } }) {
    return (
        <RequireAuth allowedRoles={['ADMIN']}>
            <main className="min-h-screen bg-neutral-950 p-8 space-y-8">
                <header className="flex justify-between items-center border-b border-neutral-800 pb-6">
                    <div className="space-y-1">
                        <Link
                            href="/admin/schools"
                            className="text-xs font-mono uppercase tracking-widest text-neutral-500 hover:text-white transition-colors flex items-center gap-2 mb-4 group"
                        >
                            <svg className="w-3 h-3 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Reports
                        </Link>
                        <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                            School Analytics
                        </h1>
                        <p className="text-neutral-500 text-sm font-mono uppercase tracking-widest">
                            ID: {params.id} • Detailed Performance Statistics
                        </p>
                    </div>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-32 bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-end animate-pulse">
                            <div className="h-1.5 w-12 bg-neutral-800 rounded-full mb-3" />
                            <div className="h-3 w-24 bg-neutral-800 rounded-full opacity-50" />
                        </div>
                    ))}
                </section>

                <div className="h-96 bg-neutral-900/20 border border-neutral-800 border-dashed rounded-[2rem] flex items-center justify-center text-neutral-700 font-mono text-xs uppercase tracking-[0.4em]">
                    Detailed data visualization pending integration
                </div>
            </main>
        </RequireAuth>
    );
}
