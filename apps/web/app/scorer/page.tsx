export default function ScorerDashboard() {
    return (
        <main className="p-8 space-y-8">
            <header className="flex justify-between items-end border-b border-neutral-800 pb-6">
                <div className="space-y-1">
                    <h2 className="text-sm font-mono uppercase tracking-[0.3em] text-neutral-500">
                        Operational Dashboard
                    </h2>
                    <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
                        Scoring Terminal
                    </h1>
                </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 flex items-center justify-center group hover:bg-neutral-900 transition-colors">
                    <p className="text-neutral-600 font-mono text-xs uppercase tracking-widest group-hover:text-emerald-500 transition-colors">Active Heats Widget</p>
                </div>
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 flex items-center justify-center group hover:bg-neutral-900 transition-colors">
                    <p className="text-neutral-600 font-mono text-xs uppercase tracking-widest group-hover:text-emerald-500 transition-colors">Recent Submissions Widget</p>
                </div>
            </section>
        </main>
    );
}
