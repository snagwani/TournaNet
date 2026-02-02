"use client";

import React, { useState } from 'react';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // API integration will be handled in the next step
        console.log("Login attempt:", { email, password });
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
                            className="w-full bg-neutral-950 border border-neutral-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:border-transparent transition-all placeholder:text-neutral-700"
                            placeholder="admin@tournanet.app"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                            className="w-full bg-neutral-950 border border-neutral-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:border-transparent transition-all placeholder:text-neutral-700"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-xl shadow-white/5"
                >
                    Sign In
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
