"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../app/context/AuthContext';

interface RequireAuthProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export default function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
    const { accessToken, user, isLoading } = useAuth();
    const router = useRouter();

    const [isUnauthorized, setIsUnauthorized] = React.useState(false);

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                // Show unauthorized message and then redirect even if not logged in
                setIsUnauthorized(true);
                const timer = setTimeout(() => {
                    router.push('/login');
                }, 2000);
                return () => clearTimeout(timer);
            } else if (allowedRoles && !allowedRoles.includes(user.role)) {
                setIsUnauthorized(true);
                const timer = setTimeout(() => {
                    router.push('/login');
                }, 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [user, isLoading, allowedRoles, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-neutral-800 border-t-white rounded-full animate-spin" />
                <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">
                    Verifying Credentials...
                </p>
            </div>
        );
    }

    if (isUnauthorized) {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-6">
                <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Access Denied</h2>
                    <p className="text-neutral-500 text-sm font-mono uppercase tracking-[0.2em]">
                        Insufficient Permissions • Redirecting to Login
                    </p>
                </div>
            </div>
        );
    }

    if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
        return null;
    }

    return <>{children}</>;
}
