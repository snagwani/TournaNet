import LoginForm from './LoginForm';

export default function LoginPage() {
    return (
        <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neutral-800/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md space-y-8">
                <header className="text-center space-y-4 mb-4">
                    <div className="inline-flex items-center justify-center p-3 bg-neutral-900 border border-neutral-800 rounded-2xl mb-4 shadow-xl">
                        <span className="text-2xl">🏟️</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-600 uppercase italic">
                        TournaNet
                    </h1>
                    <div className="h-0.5 w-12 bg-neutral-800 mx-auto rounded-full" />
                </header>

                <LoginForm />

                <footer className="text-center mt-12">
                    <a href="/" className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors uppercase tracking-widest font-mono">
                        ← Return to Dashboard
                    </a>
                </footer>
            </div>
        </main>
    );
}
