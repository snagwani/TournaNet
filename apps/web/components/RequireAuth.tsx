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

    useEffect(() => {
        if (!isLoading) {
            if (!accessToken) {
                router.push('/login');
            } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
                // If logged in but role not allowed, redirect to a default safe page
                // or show an unauthorized state. For now, redirecting to home or login.
                router.push('/');
            }
        }
    }, [accessToken, user, isLoading, allowedRoles, router]);

    if (isLoading || !accessToken || (allowedRoles && user && !allowedRoles.includes(user.role))) {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-neutral-800 border-t-white rounded-full animate-spin" />
                <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">
                    Verifying Credentials...
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
