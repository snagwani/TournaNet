export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-8 font-sans">
      <div className="max-w-5xl w-full space-y-16 text-center">
        <header className="space-y-4">
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-600 uppercase italic">
            🏟️ TournaNet Live Scoreboard
          </h1>
          <div className="h-1 w-32 bg-neutral-800 mx-auto rounded-full" />
        </header>

        <section className="relative group max-w-3xl mx-auto w-full">
          <div className="absolute -inset-1 bg-gradient-to-r from-neutral-800 via-neutral-600 to-neutral-800 rounded-3xl blur opacity-20" />
          <div className="relative bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-20 flex flex-col items-center justify-center border-neutral-800">
            <div className="w-20 h-20 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-center mb-8 shadow-2xl">
              <svg
                className="w-10 h-10 text-neutral-700 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.828a5 5 0 117.07 0M12 11a1 1 0 100-2 1 1 0 000 2z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-neutral-300 tracking-tight">No live events yet</h2>
            <p className="mt-4 text-neutral-500 text-lg leading-relaxed">
              Updates will appear here in real-time as soon as the tournament starts.
            </p>
          </div>
        </section>

        <footer className="pt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
            <span className="text-xs font-mono text-neutral-400 tracking-widest uppercase">System Standby • Auto-Refresh On</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
