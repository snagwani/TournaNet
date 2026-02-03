"use client";

import React from 'react';
import RequireAuth from '../../components/RequireAuth';
import LogoutButton from '../../components/LogoutButton';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const navLinks = [
        { name: 'Events', href: '/admin/events' },
        { name: 'Athletes', href: '/admin/athletes' },
        { name: 'Schools', href: '/admin/schools' },
    ];

    return (
        <RequireAuth allowedRoles={['ADMIN']}>
            <div className="min-h-screen bg-neutral-950">
                <nav className="border-b border-neutral-800 bg-neutral-950/50 backdrop-blur-xl sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <Link href="/admin" className="flex items-center gap-2 group">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                                    <span className="text-white font-black italic">T</span>
                                </div>
                                <span className="text-xl font-black text-white uppercase italic tracking-tighter">
                                    TournaNet
                                </span>
                            </Link>

                            <div className="hidden md:flex items-center gap-6">
                                {navLinks.map((link) => {
                                    const isActive = pathname.startsWith(link.href);
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={`text-[10px] font-black uppercase tracking-widest transition-all relative py-2 ${isActive ? 'text-white' : 'text-neutral-500 hover:text-white'
                                                }`}
                                        >
                                            {link.name}
                                            {isActive && (
                                                <div className="absolute -bottom-[26px] left-0 right-0 h-0.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        <LogoutButton />
                    </div>
                </nav>
                {children}
            </div>
        </RequireAuth>
    );
}
