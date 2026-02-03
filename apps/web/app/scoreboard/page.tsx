"use client";

import React, { useState } from 'react';

type TabType = 'current' | 'upcoming' | 'results' | 'tally' | 'search';

export default function ScoreboardPage() {
    const [activeTab, setActiveTab] = useState<TabType>('current');

    const tabs = [
        { id: 'current', label: 'Current Events', icon: '⚡' },
        { id: 'upcoming', label: 'Upcoming', icon: '📅' },
        { id: 'results', label: 'Results', icon: '🏆' },
        { id: 'tally', label: 'Medal Tally', icon: '📊' },
        { id: 'search', label: 'Athlete Search', icon: '🔍' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'current':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-12 text-center">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                                <span className="text-2xl">⚡</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Live Tracking Active</h3>
                            <p className="text-neutral-500 max-w-sm mx-auto">
                                Real-time heat updates and live timings will appear here once the session begins.
                            </p>
                        </div>
                    </div>
                );
            case 'upcoming':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-12 text-center">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                                <span className="text-2xl">📅</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Next Up</h3>
                            <p className="text-neutral-500 max-w-sm mx-auto">
                                Stay tuned for the upcoming schedule of events and heat assignments.
                            </p>
                        </div>
                    </div>
                );
            case 'results':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-12 text-center">
                            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
                                <span className="text-2xl">🏆</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Hall of Fame</h3>
                            <p className="text-neutral-500 max-w-sm mx-auto">
                                Final standings and verified results for completed events will be archived here.
                            </p>
                        </div>
                    </div>
                );
            case 'tally':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-12 text-center">
                            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
                                <span className="text-2xl">📊</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">School Standings</h3>
                            <p className="text-neutral-500 max-w-sm mx-auto">
                                Overall points and medal counts for all participating schools.
                            </p>
                        </div>
                    </div>
                );
            case 'search':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by name or bib number..."
                                className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-12 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">🔍</span>
                        </div>
                        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-12 text-center">
                            <p className="text-neutral-500">Start typing to find athletes and view their performance history.</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
            {/* Immersive Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
            </div>

            <div className="relative max-w-6xl mx-auto px-4 py-8 md:py-16">
                {/* Header */}
                <header className="mb-12 text-center space-y-4">
                    <div className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full mb-2">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em]">
                            Official Tournament Hub
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase italic flex flex-col items-center">
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-500">
                            Live Athletics
                        </span>
                        <span className="text-blue-500 -mt-2">Scoreboard</span>
                    </h1>
                </header>

                {/* Tab Navigation */}
                <nav className="flex flex-wrap justify-center gap-2 mb-12 p-1.5 bg-neutral-900/50 border border-neutral-800 rounded-[2rem] md:rounded-full overflow-hidden backdrop-blur-xl">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`
                                flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300
                                ${activeTab === tab.id
                                    ? 'bg-white text-black shadow-xl scale-105'
                                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                                }
                            `}
                        >
                            <span className="hidden sm:inline">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* Main Content */}
                <main className="min-h-[400px]">
                    {renderContent()}
                </main>

                {/* Footer */}
                <footer className="mt-24 pt-8 border-t border-neutral-900 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-600 uppercase tracking-[0.3em]">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Secure Real-time Data Sync Active
                        </div>
                        <p className="text-[10px] text-neutral-800 uppercase tracking-widest">
                            TournaNet Spectator Client • v2.1.0-Spectate
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
