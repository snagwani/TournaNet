"use client";

import RequireAuth from '../../components/RequireAuth';

export default function ScorerDashboard() {
    return (
        <RequireAuth allowedRoles={['SCORER', 'ADMIN']}>
            <main className="min-h-screen bg-neutral-950 p-8 space-y-8">
                <header className="flex justify-between items-center border-b border-neutral-800 pb-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                            Scoring Center
                        </h1>
                        <p className="text-neutral-500 text-sm font-mono uppercase tracking-widest">
                            Real-time Result Submission • Secure
                        </p>
                    </div>
                    <div className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-bold text-white uppercase tracking-widest">
                        Role: Scorer
                    </div>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 flex items-center justify-center">
                        <p className="text-neutral-600 font-mono text-xs uppercase tracking-widest">Active Heats Widget</p>
                    </div>
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 flex items-center justify-center">
                        <p className="text-neutral-600 font-mono text-xs uppercase tracking-widest">Recent Submissions Widget</p>
                    </div>
                </section>
            </main>
        </RequireAuth>
    );
}
