export default function AdminDashboard() {
    return (
        <main className="p-8 space-y-8">
            <header className="flex justify-between items-end border-b border-neutral-800 pb-6">
                <div className="space-y-1">
                    <h2 className="text-sm font-mono uppercase tracking-[0.3em] text-neutral-500">
                        Operational Overview
                    </h2>
                    <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
                        System Status
                    </h1>
                </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Dashboard Widgets Placeholder */}
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-48 bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-end group hover:bg-neutral-900 transition-colors">
                        <div className="h-2 w-12 bg-neutral-800 rounded-full mb-4 group-hover:bg-blue-500 transition-colors" />
                        <div className="h-4 w-24 bg-neutral-700 rounded-full" />
                    </div>
                ))}
            </section>
        </main>
    );
}
