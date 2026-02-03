"use client";

import { AuthProvider } from "../app/context/AuthContext";

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    );
}
