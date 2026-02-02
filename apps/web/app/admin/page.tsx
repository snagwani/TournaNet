"use client";

import RequireAuth from '../../components/RequireAuth';

export default function AdminDashboard() {
    return (
        <RequireAuth allowedRoles={['ADMIN']}>
            <main className="min-h-screen bg-neutral-950 p-8 space-y-8">
                <header className="flex justify-between items-center border-b border-neutral-800 pb-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                            Admin Dashboard
                        </h1>
                        <p className="text-neutral-500 text-sm font-mono uppercase tracking-widest">
                            Tournament Management System • Secure
                        </p>
                    </div>
                    <div className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl">
                        <span className="text-xs font-bold text-white uppercase tracking-widest">Role: Admin</span>
                    </div>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Dashboard Widgets Placeholder */}
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-48 bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-end">
                            <div className="h-2 w-12 bg-neutral-800 rounded-full mb-4" />
                            <div className="h-4 w-24 bg-neutral-700 rounded-full" />
                        </div>
                    ))}
                </section>
            </main>
        </RequireAuth>
    );
}
