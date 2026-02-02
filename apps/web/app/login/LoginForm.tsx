"use client";

import React, { useState } from 'react';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Authentication failed');
            }

            // Success: Store token in memory
            setToken(data.accessToken);
            console.log("Login successful, token stored in memory.");
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md space-y-8 bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 p-10 rounded-3xl shadow-2xl">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-white">Welcome Back</h2>
                <p className="text-neutral-500 text-sm">Please enter your details to sign in</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-neutral-500 ml-1" htmlFor="email">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            className="w-full bg-neutral-950 border border-neutral-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:border-transparent transition-all placeholder:text-neutral-700 disabled:opacity-50"
                            placeholder="admin@tournanet.app"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-neutral-500 ml-1" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            className="w-full bg-neutral-950 border border-neutral-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:border-transparent transition-all placeholder:text-neutral-700 disabled:opacity-50"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-3 px-4 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                {token && (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-500 text-xs py-3 px-4 rounded-xl flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Login Successful! Token stored in memory.
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-neutral-200 active:scale-[0.98] disabled:opacity-50 transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Authenticating...
                        </>
                    ) : (
                        'Sign In'
                    )}
                </button>
            </form>

            <div className="pt-4 text-center">
                <p className="text-[10px] text-neutral-600 uppercase tracking-[0.2em] font-medium leading-relaxed">
                    Authorized Personnel Only • Secure Session
                </p>
            </div>
        </div>
    );
}
