"use client";

import React, { useState, useEffect } from 'react';

type Tab = 'live' | 'upcoming' | 'results';

interface ScoreboardResultRow {
  athleteId: string;
  bibNumber: number;
  athleteName: string;
  resultValue: string | null;
  status: string;
  rank: number | null;
}

interface ScoreboardEvent {
  eventId: string;
  name: string;
  eventType: 'TRACK' | 'FIELD';
  category: string;
  gender: string;
  status: string;
  startTime?: string;
  liveResults?: ScoreboardResultRow[];
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('live');
  const [events, setEvents] = useState<ScoreboardEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    // Avoid showing loading state on auto-refresh for better UX
    if (events.length === 0) setLoading(true);

    const endpoint = activeTab === 'live' ? 'current' : activeTab;
    try {
      const res = await fetch(`http://localhost:3001/api/scoreboard/${endpoint}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Fetch error:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (activeTab === 'live') {
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'live', label: 'Live' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'results', label: 'Results' },
  ];

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center p-8 font-sans">
      <div className="max-w-5xl w-full space-y-12 text-center mt-12">
        <header className="space-y-6">
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-600 uppercase italic">
            🏟️ TournaNet Live Scoreboard
          </h1>

          {/* Tab Navigation */}
          <nav className="flex justify-center gap-2 p-1 bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl w-fit mx-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === tab.id
                    ? 'bg-neutral-100 text-neutral-950 shadow-lg'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        <section className="w-full max-w-4xl mx-auto min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center p-20 animate-pulse text-neutral-700 font-mono tracking-widest uppercase text-xs">
              Synchronizing Event Data...
            </div>
          ) : events.length === 0 ? (
            <div className="bg-neutral-900/40 border border-neutral-800/50 rounded-3xl p-16 flex flex-col items-center">
              <h2 className="text-2xl font-semibold text-neutral-500">
                {activeTab === 'live' ? 'No live events right now' : `No ${activeTab} found`}
              </h2>
            </div>
          ) : (
            <div className="grid gap-6">
              {events.map((event) => (
                <div
                  key={event.eventId}
                  className="bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-colors p-6 rounded-2xl flex flex-col text-left group gap-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase ${event.eventType === 'TRACK' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'
                          }`}>
                          {event.eventType}
                        </span>
                        <span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
                          {event.category} • {event.gender}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-neutral-200 group-hover:text-white transition-colors uppercase italic">
                        {event.name}
                      </h3>
                    </div>

                    {/* Meta Info (Time/Status) */}
                    <div className="flex items-center gap-4">
                      {activeTab === 'upcoming' && (
                        <div className="text-right">
                          <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1 font-semibold">Start Time</p>
                          <p className="text-xl font-mono text-neutral-300">{event.startTime}</p>
                        </div>
                      )}
                      {activeTab === 'live' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/5 border border-green-500/20 rounded-lg">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Live</span>
                        </div>
                      )}
                      {activeTab === 'results' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Final</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Results Display (Gold/Silver/Bronze) */}
                  {activeTab === 'results' && event.liveResults && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-neutral-800/50">
                      {[1, 2, 3].map((rank) => {
                        const medalist = event.liveResults?.find(r => r.rank === rank);
                        const label = rank === 1 ? 'Gold' : rank === 2 ? 'Silver' : 'Bronze';
                        const color = rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-neutral-400' : 'text-orange-500';

                        return (
                          <div key={rank} className="flex items-center gap-3 p-3 bg-neutral-950/50 border border-neutral-800/50 rounded-xl">
                            <span className={`text-[10px] font-black uppercase tracking-tighter ${color} w-10`}>{label}</span>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-neutral-300 leading-tight">
                                {medalist ? medalist.athleteName : '—'}
                              </p>
                              {medalist && <p className="text-[10px] text-neutral-600 font-medium">#{medalist.bibNumber}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="pt-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-full">
            <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'live' ? 'bg-green-500 animate-pulse' : 'bg-neutral-600'}`} />
            <span className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">
              {activeTab === 'live' ? 'Auto-Refreshing @ 30s' : 'Static View'}
            </span>
          </div>
        </footer>
      </div>
    </main>
  );
}
